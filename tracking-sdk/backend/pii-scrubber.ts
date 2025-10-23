/**
 * PII Scrubber - removes sensitive data before storage
 */

const PII_PATTERNS = [
  { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'Credit Card', pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
  { name: 'Email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: 'Phone', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
  { name: 'IP Address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

export function scrubPII(text: string | undefined): string | undefined {
  if (!text) return text;

  let scrubbed = text;

  for (const { pattern } of PII_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED]');
  }

  return scrubbed;
}

export function scrubEventBatch(batch: any): any {
  // Deep clone to avoid mutating original
  const scrubbed = JSON.parse(JSON.stringify(batch));

  // Scrub each event
  for (const event of scrubbed.events) {
    // Scrub URL parameters that might contain sensitive data
    if (event.url) {
      event.url = scrubUrlParams(event.url);
    }

    // Scrub text content
    if (event.target?.text) {
      event.target.text = scrubPII(event.target.text);
    }

    // Scrub input values (but they should already be masked)
    if (event.value) {
      event.value = scrubPII(event.value);
    }

    // Scrub error messages
    if (event.error?.message) {
      event.error.message = scrubPII(event.error.message);
    }

    if (event.error?.stack) {
      event.error.stack = scrubPII(event.error.stack);
    }

    // Scrub custom event properties
    if (event.properties) {
      event.properties = scrubObject(event.properties);
    }
  }

  // Scrub user agent (keep browser but remove detailed version info)
  if (scrubbed.metadata?.userAgent) {
    scrubbed.metadata.userAgent = anonymizeUserAgent(scrubbed.metadata.userAgent);
  }

  return scrubbed;
}

function scrubUrlParams(url: string): string {
  try {
    const urlObj = new URL(url);

    // List of sensitive param names
    const sensitiveParams = [
      'token',
      'key',
      'secret',
      'password',
      'pwd',
      'email',
      'user',
      'username',
      'session',
      'auth',
      'api_key',
      'apikey',
    ];

    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    }

    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return original
    return url;
  }
}

function scrubObject(obj: Record<string, any>): Record<string, any> {
  const scrubbed: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      scrubbed[key] = scrubPII(value);
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubObject(value);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

function anonymizeUserAgent(ua: string): string {
  // Keep browser family but remove detailed version
  // e.g., "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
  // becomes "Chrome"

  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';

  return 'Other';
}