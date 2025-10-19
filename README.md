# Hotjar-like Screen Recording System

A complete screen recording and session replay system built with Spring Boot and JavaScript, featuring both custom event recording and RRWeb-based DOM replay.

## Features

### Two Recording Systems

**1. Custom Event Recorder**
- Lightweight event tracking
- Mouse movements, clicks, scrolls
- Keyboard input
- Window resize and visibility
- Custom playback viewer

**2. RRWeb Session Replay**
- Full DOM recording and replay
- Pixel-perfect session reconstruction
- Industry-standard library
- Built-in privacy controls
- Professional playback controls

## Quick Start

### 1. Database Setup

The project uses MySQL. Make sure MySQL is running and update credentials in `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/hotjar?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
```

### 2. Start the Application

```bash
./gradlew bootRun
```

### 3. Access the Dashboard

Open your browser to:
```
http://localhost:8080/
```

## Project Structure

```
hotjar/
├── src/main/java/com/srscons/hotjar/
│   ├── controller/
│   │   ├── RecordingController.java      # Custom recorder API
│   │   └── ReplayController.java         # RRWeb replay API
│   ├── service/
│   │   ├── RecordingService.java
│   │   └── ReplayService.java
│   ├── entity/
│   │   ├── RecordingSession.java         # Custom sessions
│   │   ├── RecordingEvent.java           # Custom events
│   │   ├── ReplaySession.java            # RRWeb sessions
│   │   └── ReplayEventBatch.java         # RRWeb event batches
│   ├── repository/
│   │   ├── RecordingSessionRepository.java
│   │   ├── RecordingEventRepository.java
│   │   ├── ReplaySessionRepository.java
│   │   └── ReplayEventBatchRepository.java
│   └── dto/
│       ├── StartSessionRequest.java
│       ├── RecordEventRequest.java
│       └── ReplayIngestRequest.java
│
├── src/main/resources/
│   ├── static/
│   │   ├── index.html                    # Main dashboard
│   │   ├── demo.html                     # Custom recorder demo
│   │   ├── viewer.html                   # Custom replay viewer
│   │   ├── hotjar-recorder.js            # Custom recorder library
│   │   ├── rrweb-recorder.html           # RRWeb demo page
│   │   ├── rrweb-player.html             # RRWeb replay player
│   │   └── rrweb-embed.js                # RRWeb standalone script
│   └── application.properties
│
├── SCREEN_RECORDING_README.md            # Custom recorder docs
├── RRWEB_README.md                       # RRWeb integration docs
└── README.md                             # This file
```

## Pages Overview

### Main Dashboard (`/`)
Landing page with navigation to all features

### Custom Recorder
- **Demo** (`/demo.html`) - Test custom recording
- **Viewer** (`/viewer.html`) - Replay custom sessions
- **Library** (`/hotjar-recorder.js`) - Standalone recorder

### RRWeb Replay
- **Demo** (`/rrweb-recorder.html`) - Test RRWeb recording
- **Player** (`/rrweb-player.html`) - Replay RRWeb sessions
- **Library** (`/rrweb-embed.js`) - Embeddable script

## API Documentation

### Custom Recorder API

#### POST `/api/recording/start`
Start a new recording session

**Request:**
```json
{
  "url": "http://example.com",
  "viewportWidth": 1920,
  "viewportHeight": 1080,
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "sessionId": "uuid-here"
}
```

#### POST `/api/recording/event`
Record a user event

**Request:**
```json
{
  "sessionId": "uuid-here",
  "timestamp": 1234567890,
  "eventType": "click",
  "eventData": "{\"x\":100,\"y\":200}"
}
```

#### POST `/api/recording/end/{sessionId}`
End a recording session

#### GET `/api/recording/sessions`
Get all recorded sessions

#### GET `/api/recording/events/{sessionId}`
Get all events for a session

### RRWeb Replay API

#### POST `/api/replay/ingest`
Ingest RRWeb event batch

**Request:**
```json
{
  "sessionId": "uuid-here",
  "events": [...],
  "timestamp": 1234567890,
  "url": "http://example.com",
  "userAgent": "Mozilla/5.0...",
  "sessionEnd": false
}
```

#### GET `/api/replay/sessions`
Get all replay sessions

#### GET `/api/replay/events/{sessionId}`
Get event batches for a session

#### GET `/api/replay/session/{sessionId}`
Get session details

#### DELETE `/api/replay/session/{sessionId}`
Delete a session and its events

## Integration Examples

### Custom Recorder Integration

```html
<script src="http://localhost:8080/hotjar-recorder.js"></script>
<script>
  const recorder = new HotjarRecorder('http://localhost:8080/api/recording');
  recorder.startRecording();

  // Stop when user leaves
  window.addEventListener('beforeunload', () => {
    recorder.stopRecording();
  });
</script>
```

### RRWeb Integration

```html
<script src="http://localhost:8080/rrweb-embed.js"></script>
```

Or with custom configuration:

```html
<script>
const FLUSH_MS = 10000;
const FLUSH_COUNT = 50;
const INGEST_URL = '/api/replay/ingest';
</script>
<script src="http://localhost:8080/rrweb-embed.js"></script>
```

## Privacy Controls

### RRWeb Privacy Features

1. **Text Masking**: All text masked by default
```javascript
maskAllText: true
```

2. **Input Masking**: All inputs protected
```javascript
maskInputOptions: {
  password: true,
  email: true,
  text: true,
  // ... all input types
}
```

3. **Element Blocking**: Exclude sensitive areas
```html
<div class="rr-block">
  <!-- This won't be recorded -->
</div>
```

## Database Schema

### Custom Recorder Tables

```sql
CREATE TABLE recording_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  viewport_width INT NOT NULL,
  viewport_height INT NOT NULL,
  user_agent TEXT,
  event_data LONGTEXT
);

CREATE TABLE recording_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  timestamp BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data LONGTEXT,
  created_at DATETIME NOT NULL
);
```

### RRWeb Tables

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

CREATE TABLE replay_event_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  timestamp BIGINT NOT NULL,
  events_json LONGTEXT NOT NULL,
  event_count INT NOT NULL,
  created_at DATETIME NOT NULL
);
```

## Technology Stack

### Backend
- Java 21
- Spring Boot 3.5.6
- Spring Data JPA
- MySQL
- Lombok

### Frontend
- Vanilla JavaScript (ES6+)
- RRWeb (latest from CDN)
- RRWeb Player (latest from CDN)
- No build tools required

## Configuration

### Application Properties

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/hotjar?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect

# Server
server.port=8080
```

### RRWeb Configuration

Edit at the top of `rrweb-embed.js`:

```javascript
const FLUSH_MS = 10000;        // Send events every 10 seconds
const FLUSH_COUNT = 50;        // Or after 50 events
const INGEST_URL = '/api/replay/ingest';
```

## Development

### Build the Project

```bash
./gradlew build -x test
```

### Run the Application

```bash
./gradlew bootRun
```

### Run Tests

```bash
./gradlew test
```

## Use Cases

### Custom Recorder
- Analytics and heatmaps
- Click tracking
- User behavior analysis
- Performance monitoring
- A/B testing

### RRWeb Replay
- Bug reproduction
- Customer support
- UX research
- Training and onboarding
- Security audits

## Performance Considerations

### Custom Recorder
- Events throttled (50ms for mouse, 100ms for scroll)
- Small payload size
- Minimal performance impact

### RRWeb
- DOM snapshots every 5 minutes
- Event batching (10s or 50 events)
- `sendBeacon` for page unload
- Configurable sampling rates

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Modern browsers with ES6+ support

## Security Considerations

1. **Authentication**: Add auth to API endpoints in production
2. **Rate Limiting**: Protect ingest endpoints
3. **Data Validation**: Validate all incoming data
4. **CORS**: Configure appropriately for production
5. **Privacy**: Review and customize masking rules
6. **Data Retention**: Implement cleanup policies

## Roadmap

- [ ] User authentication and authorization
- [ ] Session search and filtering
- [ ] Heatmap generation
- [ ] Funnel analysis
- [ ] Error tracking integration
- [ ] Real-time session streaming
- [ ] Analytics dashboard
- [ ] Export functionality
- [ ] Data compression
- [ ] CDN integration

## Contributing

This is a demonstration project. Feel free to extend and customize for your needs.

## Documentation

- [Custom Recorder Documentation](SCREEN_RECORDING_README.md)
- [RRWeb Integration Documentation](RRWEB_README.md)

## License

This is a demonstration project for educational purposes.

## Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [RRWeb GitHub](https://github.com/rrweb-io/rrweb)
- [RRWeb Documentation](https://www.rrweb.io/)

## Support

For issues or questions, refer to the documentation files or check the inline code comments.