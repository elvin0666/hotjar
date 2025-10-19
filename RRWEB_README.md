# RRWeb Session Replay Integration

## Overview

This project includes a complete **RRWeb-based session replay system** that captures and replays user sessions with full DOM fidelity. Unlike simple event tracking, RRWeb records a complete visual replay of user interactions.

## What is RRWeb?

**RRWeb** (Record and Replay Web) is an open-source library that records everything happening in a web page, including:
- Complete DOM structure and styles
- Mouse movements and clicks
- Scrolling
- Keyboard input (with privacy controls)
- Window resizing
- Input field changes
- Dynamic content updates

## Architecture

### Frontend

**1. Recording Script** (`rrweb-embed.js`)
- Standalone JavaScript file that can be embedded in any webpage
- Automatically loads RRWeb from CDN
- Generates unique session IDs
- Buffers events and sends them in batches
- Configuration at the top of the file

**2. Demo Page** (`rrweb-recorder.html`)
- Interactive demo page with privacy examples
- Shows masked text and blocked elements
- Demonstrates all recording features

**3. Player Page** (`rrweb-player.html`)
- Full-featured replay player
- Timeline controls with seek functionality
- Variable speed playback (0.5x to 8x)
- Session statistics
- Delete sessions

### Backend (Spring Boot)

**Entities:**
- `ReplaySession` - Session metadata (URL, timestamps, event count)
- `ReplayEventBatch` - Batches of RRWeb events (stored as JSON)

**Repositories:**
- `ReplaySessionRepository` - Session data access
- `ReplayEventBatchRepository` - Event batch storage

**Service:**
- `ReplayService` - Business logic for ingestion and retrieval

**Controller:**
- `ReplayController` - REST API for ingest and playback

## Configuration

The recorder script has three key configuration variables at the top:

```javascript
const FLUSH_MS = 10000;        // Send events every 10 seconds
const FLUSH_COUNT = 50;        // Or after 50 events (whichever comes first)
const INGEST_URL = '/api/replay/ingest';
```

## Privacy Controls

The recorder implements comprehensive privacy protection:

### 1. Text Masking
All text content is masked by default with `maskAllText: true`

### 2. Input Masking
All input fields are masked with `maskInputOptions`:
- password
- email
- text
- textarea
- tel
- search
- url
- number
- date
- color
- time
- week
- month
- datetime
- datetime-local

### 3. Element Blocking
Elements with the `.rr-block` class are completely excluded from recording:

```html
<div class="rr-block">
  <!-- This content will NOT be recorded -->
  <p>Sensitive information here</p>
</div>
```

### 4. Custom Masking
Elements with the `.rr-mask` class can be selectively masked.

## How to Use

### 1. Embed in Your Website

Add this script to your HTML:

```html
<script src="http://localhost:8080/rrweb-embed.js"></script>
```

The recorder will automatically:
- Generate a unique session ID using `crypto.randomUUID()`
- Start recording all interactions
- Buffer events in memory
- Send events every 10 seconds or after 50 events
- Send remaining events on page close using `navigator.sendBeacon()`

### 2. Manual Control (Optional)

Access the recorder API for manual control:

```javascript
// Get the current session ID
const sessionId = window.RRWebRecorder.getSessionId();

// Manually flush events to server
window.RRWebRecorder.flush();

// Stop recording
window.RRWebRecorder.stop();
```

### 3. View Recorded Sessions

Navigate to `http://localhost:8080/rrweb-player.html` to:
- See all recorded sessions
- Click on a session to load it
- Use playback controls:
  - Play/Pause
  - Seek through timeline
  - Change playback speed (0.5x, 1x, 2x, 4x, 8x)
  - Delete sessions

## Event Batching

The recorder uses intelligent event batching:

### Flush Triggers
Events are sent to the server when:
1. **Time-based**: Every 10 seconds (configurable via `FLUSH_MS`)
2. **Count-based**: After 50 events (configurable via `FLUSH_COUNT`)
3. **Page unload**: Remaining events sent via `sendBeacon()`

### Benefits
- Reduces server requests
- Minimizes network overhead
- Ensures data isn't lost on page close
- Configurable to match your needs

## API Endpoints

### POST `/api/replay/ingest`
Ingest a batch of RRWeb events

**Request:**
```json
{
  "sessionId": "uuid-here",
  "events": [...],  // Array of RRWeb event objects
  "timestamp": 1234567890,
  "url": "http://example.com",
  "userAgent": "Mozilla/5.0...",
  "sessionEnd": false
}
```

### GET `/api/replay/sessions`
Get all recorded sessions

**Response:**
```json
[
  {
    "id": 1,
    "sessionId": "uuid-here",
    "url": "http://example.com",
    "startTime": "2025-01-15T10:30:00",
    "lastActivityTime": "2025-01-15T10:35:00",
    "endTime": null,
    "userAgent": "Mozilla/5.0...",
    "eventCount": 245,
    "sessionEnded": false
  }
]
```

### GET `/api/replay/events/{sessionId}`
Get all event batches for a session

**Response:**
```json
[
  {
    "id": 1,
    "sessionId": "uuid-here",
    "timestamp": 1234567890,
    "eventsJson": "[...]",
    "eventCount": 50,
    "createdAt": "2025-01-15T10:30:00"
  }
]
```

### GET `/api/replay/session/{sessionId}`
Get session details

### DELETE `/api/replay/session/{sessionId}`
Delete a session and all its events

## Database Schema

### replay_sessions
```sql
CREATE TABLE replay_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  url VARCHAR(2048) NOT NULL,
  start_time DATETIME NOT NULL,
  last_activity_time DATETIME,
  end_time DATETIME,
  user_agent TEXT,
  event_count INT NOT NULL DEFAULT 0,
  session_ended BOOLEAN DEFAULT FALSE
);
```

### replay_event_batches
```sql
CREATE TABLE replay_event_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  timestamp BIGINT NOT NULL,
  events_json LONGTEXT NOT NULL,
  event_count INT NOT NULL,
  created_at DATETIME NOT NULL
);
```

## Standalone Script Tag

If you want to copy-paste the recorder into an HTML file:

```html
<script>
// Configuration
const FLUSH_MS = 10000;
const FLUSH_COUNT = 50;
const INGEST_URL = '/api/replay/ingest';

// Session Recorder
(function() {
    'use strict';

    // Load rrweb from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js';
    script.onload = initRecorder;
    document.head.appendChild(script);

    let sessionId = null;
    let eventBuffer = [];
    let flushTimer = null;
    let stopRecordFn = null;

    function initRecorder() {
        sessionId = crypto.randomUUID();
        console.log('[RRWeb] Session started:', sessionId);

        stopRecordFn = rrweb.record({
            emit(event) {
                eventBuffer.push(event);
                if (eventBuffer.length >= FLUSH_COUNT) {
                    flushEvents();
                }
            },
            maskAllText: true,
            maskInputOptions: {
                password: true,
                email: true,
                text: true,
                textarea: true,
                tel: true,
                search: true,
                url: true,
                number: true,
                date: true,
                color: true,
                time: true,
                week: true,
                month: true,
                datetime: true,
                'datetime-local': true
            },
            blockClass: 'rr-block',
            maskTextClass: 'rr-mask',
            checkoutEveryNms: 5 * 60 * 1000,
            mousemoveWait: 50,
            inlineStylesheet: true,
            recordCanvas: false,
            collectFonts: true
        });

        startFlushTimer();
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);
    }

    function startFlushTimer() {
        if (flushTimer) clearInterval(flushTimer);
        flushTimer = setInterval(() => {
            if (eventBuffer.length > 0) flushEvents();
        }, FLUSH_MS);
    }

    function flushEvents() {
        if (eventBuffer.length === 0) return;

        const eventsToSend = [...eventBuffer];
        eventBuffer = [];

        const payload = {
            sessionId: sessionId,
            events: eventsToSend,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        fetch(INGEST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        })
        .then(response => {
            if (response.ok) {
                console.log(`[RRWeb] Sent ${eventsToSend.length} events`);
            } else {
                eventBuffer = [...eventsToSend, ...eventBuffer];
            }
        })
        .catch(error => {
            console.error('[RRWeb] Error:', error);
            eventBuffer = [...eventsToSend, ...eventBuffer];
        });
    }

    function handleUnload() {
        if (stopRecordFn) stopRecordFn();
        if (flushTimer) clearInterval(flushTimer);

        if (eventBuffer.length > 0) {
            const payload = {
                sessionId: sessionId,
                events: eventBuffer,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionEnd: true
            };

            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(INGEST_URL, blob);
            eventBuffer = [];
        }
    }

    window.RRWebRecorder = {
        getSessionId: () => sessionId,
        flush: flushEvents,
        stop: () => {
            if (stopRecordFn) {
                stopRecordFn();
                flushEvents();
            }
        }
    };
})();
</script>
```

## Performance Considerations

### Memory Usage
- Events are buffered in memory until flushed
- Buffer is cleared after successful send
- Failed sends keep events in buffer for retry

### Network Efficiency
- Events batched to reduce requests
- `keepalive: true` ensures delivery
- `sendBeacon` for page unload

### Recording Performance
- `mousemoveWait: 50` throttles mouse events
- `checkoutEveryNms: 5 * 60 * 1000` creates snapshots every 5 minutes
- `recordCanvas: false` skips canvas recording (can be enabled if needed)

## Testing

1. Start the application:
```bash
./gradlew bootRun
```

2. Open the recorder demo:
```
http://localhost:8080/rrweb-recorder.html
```

3. Interact with the page:
- Move your mouse
- Click buttons
- Type in input fields
- Scroll the page
- Resize the window

4. Check browser console for flush messages:
```
[RRWeb] Session started: uuid-here
[RRWeb] Sent 50 events
[RRWeb] Sent 27 events
```

5. Open the player:
```
http://localhost:8080/rrweb-player.html
```

6. Select your session and watch the replay!

## Differences from Custom Recorder

| Feature | Custom Recorder | RRWeb Recorder |
|---------|----------------|----------------|
| Recording Type | Event coordinates | Full DOM replay |
| Replay Fidelity | Basic cursor movement | Exact visual replay |
| File Size | Small (JSON events) | Larger (DOM snapshots) |
| Privacy | Manual masking | Built-in privacy controls |
| Implementation | Custom code | Industry-standard library |
| Use Case | Analytics, heatmaps | Bug reproduction, support |

## Production Considerations

### 1. Storage
- Event batches can be large (10KB-100KB per batch)
- Use LONGTEXT for `events_json` column
- Consider compression for storage

### 2. Privacy
- Review and customize `maskInputOptions`
- Add `.rr-block` to sensitive elements
- Consider legal requirements (GDPR, etc.)

### 3. Performance
- Adjust `FLUSH_MS` and `FLUSH_COUNT` based on traffic
- Monitor server load during ingestion
- Consider async processing for large batches

### 4. Security
- Implement authentication for replay endpoints
- Rate limit the ingest endpoint
- Validate session IDs
- Sanitize recorded data

### 5. Data Retention
- Implement automatic cleanup of old sessions
- Set retention policies (e.g., 30 days)
- Provide user data deletion APIs

## Troubleshooting

### Events not recording
- Check browser console for errors
- Verify RRWeb loaded from CDN
- Check network tab for POST requests to `/api/replay/ingest`

### Playback not working
- Ensure events exist for the session
- Check that `eventsJson` is valid JSON
- Verify RRWeb player library loaded

### High memory usage
- Reduce `FLUSH_COUNT` to send events more frequently
- Reduce `FLUSH_MS` for faster flushing
- Monitor `eventBuffer` size

## Next Steps

Potential enhancements:
- Add session search and filtering
- Implement heatmap generation from replay data
- Add user identification and metadata
- Create analytics dashboard
- Implement event compression
- Add real-time streaming for live support
- Generate funnel analysis from replays
- Add error tracking integration

## Resources

- [RRWeb GitHub](https://github.com/rrweb-io/rrweb)
- [RRWeb Documentation](https://www.rrweb.io/)
- [RRWeb Player](https://github.com/rrweb-io/rrweb-player)