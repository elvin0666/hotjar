import pako from 'pako';
import { EventBatch } from '../types';

export async function sendBatch(
  endpoint: string,
  batch: EventBatch,
  debug: boolean = false
): Promise<void> {
  try {
    const payload = JSON.stringify(batch);
    const compressed = pako.gzip(payload);

    if (debug) {
      console.log('[Tracker] Sending batch:', {
        events: batch.events.length,
        originalSize: payload.length,
        compressedSize: compressed.length,
        compressionRatio: ((1 - compressed.length / payload.length) * 100).toFixed(1) + '%',
      });
    }

    // Try sendBeacon first (better for page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([compressed], {
        type: 'application/gzip',
      });

      const sent = navigator.sendBeacon(endpoint, blob);

      if (sent) {
        if (debug) console.log('[Tracker] Sent via sendBeacon');
        return;
      }
    }

    // Fallback to fetch
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Encoding': 'gzip',
      },
      body: compressed,
      keepalive: true, // Keep request alive even if page unloads
    });

    if (debug) console.log('[Tracker] Sent via fetch');
  } catch (error) {
    if (debug) {
      console.error('[Tracker] Failed to send batch:', error);
    }
    // Silently fail - don't break the page
  }
}

export function shouldSample(sampleRate: number): boolean {
  return Math.random() < sampleRate;
}