/**
 * Backend ingestion server
 * Handles incoming event batches, validates, scrubs PII, and stores them
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import * as pako from 'pako';
import { eventBatchSchema, ValidatedEventBatch } from './validation';
import { scrubEventBatch } from './pii-scrubber';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse gzipped JSON
app.use('/v1/ingest', express.raw({ type: 'application/gzip', limit: '10mb' }));
app.use(express.json());

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Encoding');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
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