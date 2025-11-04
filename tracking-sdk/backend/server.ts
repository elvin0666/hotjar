/**
 * Backend ingestion server
 * Handles incoming event batches, validates, scrubs PII, and stores them
 */

import * as fs from 'fs';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import * as pako from 'pako';
import * as path from 'path';
import { eventBatchSchema, ValidatedEventBatch } from './validation';
import { scrubEventBatch } from './pii-scrubber';

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from dist directory (for hotjar.js)
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware to parse gzipped JSON
app.use('/v1/ingest', express.raw({ type: 'application/gzip', limit: '10mb' }));
app.use(express.json());

// ✅ CORS (development, specific origin)
app.use((req, res, next) => {
  const ORIGIN = 'http://localhost:5173'; // frontend url
  res.header('Access-Control-Allow-Origin', ORIGIN);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Content-Encoding'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // preflight response
  }

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Main ingestion endpoint
app.post('/v1/ingest', async (req: Request, res: Response) => {
  try {
    let data: any;

    // Return latest session timeline (dev helper)
    app.get('/v1/session/latest', (req: Request, res: Response) => {
      try {
        const site = (req.query.site as string) || 'cvgen-prod';
        const filePath = path.join(__dirname, '../data/events', `${site}.jsonl`);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'No events file found', filePath });
        }

        const lines = fs.readFileSync(filePath, 'utf8')
            .trim()
            .split(/\r?\n/)
            .slice(-1000); // last 1000 events

        const events = lines.map(l => JSON.parse(l));
        if (events.length === 0) return res.json({ site, events: [] });

        // group by sessionId and pick the largest (latest by count)
        const groups = new Map<string, any[]>();
        for (const e of events) {
          if (!groups.has(e.sessionId)) groups.set(e.sessionId, []);
          groups.get(e.sessionId)!.push(e);
        }
        const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
        const [sessionId, sessionEvents] = sorted[0];

        // sort by timestamp and enrich with ISO time
        const timeline = sessionEvents
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(e => ({
              time: new Date(e.timestamp).toISOString(),
              type: e.type,
              name: e.name ?? null,
              url: e.url,
              userId: e.userId ?? null,
              properties: e.properties ?? null,
            }));

        res.json({ site, sessionId, count: timeline.length, timeline });
      } catch (err: any) {
        console.error('[Timeline] error:', err);
        res.status(500).json({ error: 'failed_to_build_timeline', detail: String(err) });
      }
    });

    // Check if data is gzipped
    if (req.headers['content-encoding'] === 'gzip' ||
        req.headers['content-type'] === 'application/gzip') {

      // Decompress
      const decompressed = pako.ungzip(req.body, { to: 'string' });
      data = JSON.parse(decompressed);

      console.log(`[Ingest] Received gzipped batch (${req.body.length} bytes compressed, ${decompressed.length} bytes uncompressed)`);
    } else {
      data = req.body;
      console.log(`[Ingest] Received uncompressed batch`);
    }

    // Validate the batch
    const validationResult = eventBatchSchema.safeParse(data);

    if (!validationResult.success) {
      console.error('[Ingest] Validation failed:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Invalid event batch',
        details: validationResult.error.errors,
      });
    }

    const batch: ValidatedEventBatch = validationResult.data;

    // Scrub PII
    const scrubbedBatch = scrubEventBatch(batch);

    // Log the batch (in production, this would be stored in database)
    console.log(`[Ingest] Received batch from site ${scrubbedBatch.siteId}:`);
    console.log(`  - Events: ${scrubbedBatch.events.length}`);
    console.log(`  - Event types:`, getEventTypeCounts(scrubbedBatch.events));
    console.log(`  - SDK version: ${scrubbedBatch.metadata.sdkVersion}`);
    console.log(`  - User agent: ${scrubbedBatch.metadata.userAgent}`);

    // Store in database (example - you would implement this based on your DB)
    await storeEventBatch(scrubbedBatch);

    // Return success
    res.status(202).json({
      success: true,
      eventsProcessed: scrubbedBatch.events.length
    });

  } catch (error) {
    console.error('[Ingest] Error processing batch:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

function getEventTypeCounts(events: any[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.type] = (counts[event.type] || 0) + 1;
  }

  return counts;
}

/**
 * Store event batch in database
 * This is a placeholder - implement based on your database choice
 */
async function storeEventBatch(batch: ValidatedEventBatch): Promise<void> {
  // Example for PostgreSQL:
  /*
  await db.query(`
    INSERT INTO event_batches (site_id, events, metadata, created_at)
    VALUES ($1, $2, $3, NOW())
  `, [batch.siteId, JSON.stringify(batch.events), JSON.stringify(batch.metadata)]);

  // Also insert individual events for easier querying
  for (const event of batch.events) {
    await db.query(`
      INSERT INTO events (
        site_id, session_id, user_id, event_type,
        event_data, url, timestamp, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7/1000.0), NOW())
    `, [
      batch.siteId,
      event.sessionId,
      event.userId,
      event.type,
      JSON.stringify(event),
      event.url,
      event.timestamp
    ]);
  }
  */

  // Example for ClickHouse:
  /*
  const clickhouse = new ClickHouse({ ... });

  const rows = batch.events.map(event => ({
    site_id: batch.siteId,
    session_id: event.sessionId,
    user_id: event.userId || '',
    event_type: event.type,
    event_data: JSON.stringify(event),
    url: event.url,
    timestamp: new Date(event.timestamp),
    user_agent: batch.metadata.userAgent,
    language: batch.metadata.language,
    timezone: batch.metadata.timezone,
  }));

  await clickhouse.insert('events', rows).toPromise();
  */

  // For demo purposes, just log to file
  const fs = require('fs');
  const path = require('path');

  const logDir = path.join(__dirname, '../data/events');
  const logFile = path.join(logDir, `${batch.siteId}.jsonl`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Append each event as a new line
  for (const event of batch.events) {
    fs.appendFileSync(logFile, JSON.stringify({
      ...event,
      metadata: batch.metadata,
      receivedAt: new Date().toISOString(),
    }) + '\n');
  }

  console.log(`[Storage] Stored ${batch.events.length} events to ${logFile}`);
}

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`[Server] Analytics ingestion server running on port ${PORT}`);
  console.log(`[Server] Endpoint: http://localhost:${PORT}/v1/ingest`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

export default app;