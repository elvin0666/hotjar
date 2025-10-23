# Hotjar-like Analytics Tracking SDK

A lightweight, privacy-first analytics tracking system similar to Hotjar. Features include session tracking, event batching, GDPR compliance, PII scrubbing, and comprehensive event tracking.

## Features

- **Async Loading**: Non-blocking script loader with event queue
- **Event Tracking**: Pageviews, clicks, scrolls, inputs, errors, performance, and custom events
- **Privacy First**:
  - Automatic PII scrubbing
  - Input field masking for sensitive data
  - GDPR consent management
  - Configurable sampling rate
- **Performance Optimized**:
  - Event batching (every 3s)
  - Gzip compression
  - sendBeacon for reliability
  - Under 40KB gzipped
- **Session Management**: UUID-based sessions with localStorage
- **SPA Support**: Automatic route change detection
- **Backend Ready**: Express-based ingestion endpoint with validation

## Quick Start

### 1. Install Dependencies

```bash
cd tracking-sdk
npm install
```

### 2. Build the SDK

```bash
npm run build
```

This creates:
- `dist/loader.min.js` - Async loader (~2KB)
- `dist/sdk.min.js` - Full SDK (~35KB)

### 3. Start the Backend

```bash
npm run dev:backend
```

Backend runs on `http://localhost:3001`

### 4. Run the Demo

```bash
npm run dev:demo
```

Demo app runs on `http://localhost:3000`

## Client-Side Integration

### Basic Setup

Add this snippet to your HTML `<head>`:

```html
<script
  async
  src="https://your-cdn.com/loader.min.js"
  data-site-id="your-site-id"
  data-endpoint="https://api.your-domain.com/v1/ingest"
  data-sdk-url="https://your-cdn.com/sdk.min.js"
></script>
```

### Usage Examples

```javascript
// Track custom events
hj('track', 'button_clicked', {
  buttonName: 'signup',
  location: 'header'
});

// Identify users
hj('identify', 'user-123', {
  email: 'user@example.com',
  plan: 'premium'
});

// Update configuration
hj('config', {
  debug: true,
  sampleRate: 0.5, // Track 50% of sessions
  maskSelectors: ['.sensitive', '[data-private]']
});

// Manage consent (GDPR)
hj('consent', true); // Grant consent
hj('consent', false); // Revoke consent
```

## Event Types

The SDK automatically tracks:

1. **Pageviews** - Initial page load and SPA route changes
2. **Clicks** - User clicks with element details
3. **Scrolls** - Scroll depth at 10% intervals
4. **Inputs** - Form inputs (with automatic masking)
5. **Route Changes** - SPA navigation
6. **Errors** - JavaScript errors and promise rejections
7. **Performance** - Page load metrics (DNS, TTFB, FCP, LCP)
8. **Heartbeats** - Session duration tracking
9. **Custom** - Your custom events

## Privacy & Security

### Automatic PII Scrubbing

The backend automatically removes:
- Social Security Numbers
- Credit card numbers
- Email addresses
- Phone numbers
- IP addresses

### Input Masking

These inputs are automatically masked:
```javascript
// Default masked selectors
[
  'input[type="password"]',
  'input[type="email"]',
  'input[type="tel"]',
  'input[data-private]',
  '[data-mask]',
  '.sensitive'
]
```

Add custom selectors:
```html
<input type="text" data-mask> <!-- Will be masked -->
<div class="sensitive">...</div> <!-- Children will be masked -->
```

### GDPR Compliance

```javascript
// Check user consent first
if (userGrantedConsent) {
  hj('consent', true);
} else {
  hj('consent', false);
}

// Revoking consent clears the event queue
```

## Backend API

### POST /v1/ingest

Accepts gzipped event batches.

**Request Headers:**
```
Content-Type: application/gzip
Content-Encoding: gzip
```

**Request Body:**
```json
{
  "siteId": "your-site-id",
  "events": [
    {
      "type": "pageview",
      "timestamp": 1234567890,
      "sessionId": "uuid-v4",
      "url": "https://example.com",
      "title": "Home Page",
      ...
    }
  ],
  "metadata": {
    "sdkVersion": "1.0.0",
    "userAgent": "Chrome",
    "language": "en-US",
    "timezone": "America/New_York",
    "screen": {
      "width": 1920,
      "height": 1080,
      "colorDepth": 24
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventsProcessed": 5
}
```

### Database Storage

The example server stores events in JSONL files at `data/events/{siteId}.jsonl`.

For production, integrate with:

**PostgreSQL Example:**
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(255) NOT NULL,
  session_id UUID NOT NULL,
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_site_session (site_id, session_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp)
);
```

**ClickHouse Example:**
```sql
CREATE TABLE events (
  site_id String,
  session_id UUID,
  user_id String,
  event_type String,
  event_data String,
  url String,
  timestamp DateTime,
  user_agent String,
  language String,
  timezone String
) ENGINE = MergeTree()
ORDER BY (site_id, timestamp)
PARTITION BY toYYYYMM(timestamp);
```

## Configuration Options

```typescript
interface TrackerConfig {
  siteId: string;              // Required: Your site ID
  endpoint?: string;           // Default: '/v1/ingest'
  sampleRate?: number;         // Default: 1 (100%)
  debug?: boolean;             // Default: false
  maskSelectors?: string[];    // Additional CSS selectors to mask
  trackClicks?: boolean;       // Default: true
  trackScrolls?: boolean;      // Default: true
  trackInputs?: boolean;       // Default: true
  trackErrors?: boolean;       // Default: true
  trackPerformance?: boolean;  // Default: true
  batchInterval?: number;      // Default: 3000ms
  maxBatchSize?: number;       // Default: 50 events
  consent?: boolean;           // Default: true
}
```

## Project Structure

```
tracking-sdk/
├── src/
│   ├── loader/          # Async loader script
│   ├── sdk/             # Main SDK
│   ├── types/           # TypeScript types
│   └── utils/           # Utilities (session, privacy, transport)
├── backend/             # Ingestion server
│   ├── server.ts        # Express server
│   ├── validation.ts    # Zod schemas
│   └── pii-scrubber.ts  # PII removal
├── demo/                # Demo application
├── dist/                # Built files
└── data/                # Event storage (demo)
```

## Build Sizes

- **Loader (minified + gzipped)**: ~2KB
- **SDK (minified + gzipped)**: ~35KB
- **Total first load**: ~37KB

## Development

```bash
# Build SDK and loader
npm run build

# Watch mode for backend
npm run dev:backend

# Run demo app
npm run dev:demo

# Build everything and run
npm run dev
```

## Testing the Demo

1. Start backend: `npm run dev:backend`
2. Build SDK: `npm run build`
3. Start demo: `npm run dev:demo`
4. Open browser to `http://localhost:3000`
5. Interact with the page (click, scroll, type)
6. Check browser console for tracked events
7. Check backend terminal for received batches
8. Check `data/events/demo-site-123.jsonl` for stored events

## Production Checklist

- [ ] Set up CDN for SDK files
- [ ] Configure production endpoint URL
- [ ] Set up database (PostgreSQL/ClickHouse)
- [ ] Implement authentication for ingestion endpoint
- [ ] Add rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configure CORS properly
- [ ] Add request size limits
- [ ] Implement data retention policies
- [ ] Set up GDPR data deletion endpoint
- [ ] Add analytics dashboard

## License

MIT