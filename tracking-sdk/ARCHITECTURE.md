# System Architecture

## Overview

This is a lightweight, privacy-first analytics tracking system similar to Hotjar. The system consists of three main components:

1. **Client SDK** - JavaScript tracking library loaded in the browser
2. **Backend API** - Express server for ingesting and processing events
3. **Storage Layer** - Database for persisting event data

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Async Loader (loader.min.js - 2KB)                 │ │
│  │     - Creates window.__hjq queue                       │ │
│  │     - Loads full SDK asynchronously                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Full SDK (sdk.min.js - 35KB)                       │ │
│  │     - Event listeners (click, scroll, input, etc.)     │ │
│  │     - Session management (UUID, localStorage)          │ │
│  │     - Privacy features (masking, PII scrubbing)        │ │
│  │     - Event batching (every 3s)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Gzip compressed)
                    (sendBeacon/fetch)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. Ingestion Endpoint (/v1/ingest)                    │ │
│  │     - Decompress gzipped payload                       │ │
│  │     - Validate with Zod schemas                        │ │
│  │     - Scrub PII                                        │ │
│  │     - Store in database                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ ClickHouse   │  │ JSONL Files  │      │
│  │ (Relational) │  │ (Analytics)  │  │ (Demo)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Async Loader (`src/loader/index.ts`)

**Purpose**: Minimal script that loads asynchronously without blocking page render.

**Size**: ~2KB gzipped

**Responsibilities**:
- Create global `window.__hjq` array for early event queuing
- Create global `hj()` function
- Read config from script tag attributes
- Load full SDK asynchronously

**Loading Flow**:
```
Page loads → Loader executes → Queue created → SDK requested
     ↓
User calls hj() → Queued in __hjq → SDK loads → Queue processed
```

### 2. Full SDK (`src/sdk/`)

**Purpose**: Complete tracking implementation.

**Size**: ~35KB gzipped

**Structure**:
```
sdk/
├── tracker.ts          # Main tracking class
├── index.ts           # Entry point, queue processor
└── utils/
    ├── session.ts     # Session management
    ├── privacy.ts     # PII scrubbing, masking
    └── transport.ts   # Batching, compression, sending
```

**Key Features**:

#### Event Collection
```typescript
class Tracker {
  // Automatic tracking
  - trackPageview()
  - handleClick()
  - handleScroll()
  - handleInput()
  - handleError()
  - trackPerformance()

  // Public API
  - track(name, properties)
  - identify(userId, traits)
  - consent(granted)
  - updateConfig(config)
}
```

#### Session Management
```typescript
Session = {
  id: UUID v4,
  userId?: string,
  startTime: timestamp,
  lastActivityTime: timestamp,
  pageviews: number,
  events: number
}

// Stored in localStorage
// 30-minute timeout
```

#### Event Batching
```
Events → Queue → Batch (every 3s or 50 events) → Compress → Send
```

#### Privacy Features
- **Input Masking**: Automatically masks password, email, tel inputs
- **PII Scrubbing**: Removes SSN, credit cards, emails, phone numbers
- **Consent Management**: GDPR-compliant opt-in/opt-out
- **Sampling**: Configurable session sampling rate

### 3. Backend API (`backend/`)

**Purpose**: Receive, validate, and store event data.

**Structure**:
```
backend/
├── server.ts          # Express server
├── validation.ts      # Zod schemas
└── pii-scrubber.ts   # PII removal
```

**Request Flow**:
```
1. Receive gzipped POST to /v1/ingest
2. Decompress with pako
3. Parse JSON
4. Validate with Zod schemas
5. Scrub PII
6. Store in database
7. Return 202 Accepted
```

**Validation**:
```typescript
// Discriminated union based on event type
EventBatch = {
  siteId: string,
  events: Array<
    | PageviewEvent
    | ClickEvent
    | ScrollEvent
    | InputEvent
    | RouteChangeEvent
    | ErrorEvent
    | PerformanceEvent
    | HeartbeatEvent
    | CustomEvent
  >,
  metadata: {
    sdkVersion: string,
    userAgent: string,
    language: string,
    timezone: string,
    screen: { width, height, colorDepth }
  }
}
```

**PII Scrubbing**:
```typescript
- Scrub all text fields for patterns
- Anonymize user agents
- Redact URL parameters (token, key, password, etc.)
- Remove IP addresses
```

### 4. Storage Layer

**Options**:

#### PostgreSQL (Demo/Production)
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(255),
  session_id UUID,
  user_id VARCHAR(255),
  event_type VARCHAR(50),
  event_data JSONB,
  url TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Indexes for fast queries
CREATE INDEX idx_site_session ON events(site_id, session_id);
CREATE INDEX idx_timestamp ON events(timestamp);
CREATE INDEX idx_event_type ON events(event_type);
```

#### ClickHouse (High Volume)
```sql
CREATE TABLE events (
  site_id String,
  session_id UUID,
  event_type String,
  event_data String,
  timestamp DateTime,
  user_agent String
) ENGINE = MergeTree()
ORDER BY (site_id, timestamp)
PARTITION BY toYYYYMM(timestamp);
```

#### JSONL Files (Demo)
```
data/events/{siteId}.jsonl
```

## Data Flow

### Typical User Session

```
1. User lands on page
   ↓
2. Loader script executes (2KB downloaded)
   ↓
3. Full SDK loads in background (35KB downloaded)
   ↓
4. SDK initializes:
   - Gets/creates session
   - Tracks pageview
   - Tracks performance metrics
   - Sets up event listeners
   ↓
5. User interacts with page:
   - Clicks → ClickEvent
   - Scrolls → ScrollEvent
   - Types → InputEvent (masked if sensitive)
   ↓
6. Events queue up
   ↓
7. After 3 seconds OR 50 events:
   - Events batched
   - Compressed with gzip
   - Sent via sendBeacon (or fetch fallback)
   ↓
8. Backend receives batch:
   - Validates
   - Scrubs PII
   - Stores in database
   ↓
9. User navigates (SPA):
   - Route change detected
   - New pageview tracked
   - Scroll depth reset
   ↓
10. User leaves:
    - beforeunload event
    - Remaining events flushed
    - Session duration recorded
```

## Event Types

### 1. Pageview
```typescript
{
  type: 'pageview',
  timestamp: 1234567890,
  sessionId: 'uuid',
  url: 'https://example.com/page',
  title: 'Page Title',
  referrer: 'https://google.com',
  viewport: { width: 1920, height: 1080 }
}
```

### 2. Click
```typescript
{
  type: 'click',
  target: {
    tagName: 'button',
    id: 'signup-btn',
    className: 'btn btn-primary',
    text: 'Sign Up',
    attributes: { href: '/signup' }
  },
  position: { x: 450, y: 320 }
}
```

### 3. Scroll
```typescript
{
  type: 'scroll',
  depth: 75,  // percentage
  position: { x: 0, y: 1200 }
}
```

### 4. Input
```typescript
{
  type: 'input',
  target: {
    tagName: 'input',
    id: 'email',
    type: 'email'
  },
  masked: true,
  value: undefined  // omitted because masked
}
```

### 5. Error
```typescript
{
  type: 'error',
  error: {
    message: 'Cannot read property x of undefined',
    stack: '...',
    line: 42,
    column: 15,
    filename: '/app.js'
  }
}
```

### 6. Performance
```typescript
{
  type: 'performance',
  metrics: {
    dns: 20,
    tcp: 50,
    ttfb: 200,
    download: 100,
    domInteractive: 500,
    domComplete: 1000,
    loadComplete: 1200,
    fcp: 800,
    lcp: 1500
  }
}
```

## Privacy & Security

### Client-Side Privacy

1. **Automatic Masking**:
   ```javascript
   DEFAULT_MASK_SELECTORS = [
     'input[type="password"]',
     'input[type="email"]',
     'input[type="tel"]',
     '[data-mask]',
     '.sensitive'
   ]
   ```

2. **Text Truncation**: Element text limited to 100 chars

3. **Consent Management**:
   ```javascript
   hj('consent', false)  // Clears queue, stops tracking
   ```

4. **Sampling**:
   ```javascript
   sampleRate: 0.1  // Track only 10% of sessions
   ```

### Server-Side Security

1. **PII Scrubbing**:
   - SSN: `123-45-6789` → `[REDACTED]`
   - Email: `user@example.com` → `[REDACTED]`
   - Phone: `555-123-4567` → `[REDACTED]`
   - Credit Card: `4111-1111-1111-1111` → `[REDACTED]`

2. **URL Parameter Scrubbing**:
   ```
   /page?token=abc123&user=john
   →
   /page?token=[REDACTED]&user=john
   ```

3. **User Agent Anonymization**:
   ```
   Mozilla/5.0... Chrome/120.0.0.0
   →
   Chrome
   ```

## Performance Optimizations

### Bundle Size
- **Loader**: 2KB (minimal dependencies)
- **SDK**: 35KB (includes pako for gzip)
- **Total**: 37KB first load

### Network Efficiency
- **Batching**: Reduces requests by ~90%
- **Gzip**: 60-80% size reduction
- **sendBeacon**: Non-blocking, survives page unload

### Computational Efficiency
- **Passive listeners**: Scroll/input don't block
- **Debouncing**: Scroll depth sampled at 10% intervals
- **Lazy loading**: Full SDK loads after page interactive

## Scalability

### Client-Side
- Handles 1000s of events per session
- Automatic queue management
- Memory-efficient batching

### Server-Side
- Stateless (can scale horizontally)
- Async processing
- Rate limiting ready

### Storage
- **PostgreSQL**: Millions of events
- **ClickHouse**: Billions of events
- Partitioning by time
- Automated retention policies

## Extensibility

### Adding New Event Types

1. Define type in `src/types/index.ts`
2. Add schema in `backend/validation.ts`
3. Implement tracker method in `src/sdk/tracker.ts`

### Custom Storage Backends

Implement `storeEventBatch()` in `backend/server.ts`:
```typescript
async function storeEventBatch(batch: ValidatedEventBatch) {
  // Your custom storage logic
}
```

### Analytics Dashboard

Query stored events:
```sql
-- Daily active users
SELECT DATE(timestamp), COUNT(DISTINCT session_id)
FROM events
WHERE event_type = 'pageview'
GROUP BY DATE(timestamp);

-- Most clicked elements
SELECT event_data->>'target'->>'text', COUNT(*)
FROM events
WHERE event_type = 'click'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;
```

## Monitoring & Observability

### Metrics to Track

**Client-Side**:
- SDK load time
- Event queue size
- Batch send success rate
- Compression ratio

**Server-Side**:
- Request rate
- Validation error rate
- Processing time
- Storage latency
- Batch size distribution

### Logging

```javascript
// Client (debug mode)
[Tracker] Initialized
[Tracker] Event queued: click
[Tracker] Sending batch: 15 events, 75% compression

// Server
[Ingest] Received batch from site-123
[Ingest] Events: 15 (10 pageview, 3 click, 2 scroll)
[Storage] Stored 15 events
```

## Deployment

### Client SDK
1. Build: `npm run build`
2. Upload `dist/*.js` to CDN
3. Set cache headers (1 year)
4. Use versioned URLs for updates

### Backend
1. Deploy to Node.js server (AWS, GCP, Heroku)
2. Set environment variables
3. Configure CORS
4. Enable HTTPS
5. Set up database
6. Add monitoring

## Summary

This architecture provides:
- ✅ **Lightweight**: 37KB total
- ✅ **Privacy-first**: Automatic masking, PII scrubbing
- ✅ **Performant**: Batching, compression, async loading
- ✅ **Scalable**: Stateless backend, efficient storage
- ✅ **GDPR-ready**: Consent management, data deletion
- ✅ **Production-ready**: Validation, error handling, monitoring