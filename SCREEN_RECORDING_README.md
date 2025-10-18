# Hotjar-like Screen Recording System

## Overview

This is a screen recording system similar to Hotjar that captures user interactions on web pages. It records mouse movements, clicks, scrolls, keyboard input, and other events.

## Architecture

### Backend (Spring Boot)

1. **Entities** (`src/main/java/com/srscons/hotjar/entity/`)
   - `RecordingSession.java` - Stores session metadata (URL, viewport size, timestamps)
   - `RecordingEvent.java` - Stores individual user events (clicks, moves, etc.)

2. **Repositories** (`src/main/java/com/srscons/hotjar/repository/`)
   - `RecordingSessionRepository.java` - Database access for sessions
   - `RecordingEventRepository.java` - Database access for events

3. **DTOs** (`src/main/java/com/srscons/hotjar/dto/`)
   - `StartSessionRequest.java` - Request to start a new recording session
   - `RecordEventRequest.java` - Request to record an event

4. **Service** (`src/main/java/com/srscons/hotjar/service/`)
   - `RecordingService.java` - Business logic for managing sessions and events

5. **Controller** (`src/main/java/com/srscons/hotjar/controller/`)
   - `RecordingController.java` - REST API endpoints

### Frontend (JavaScript)

1. **Recording Library** (`src/main/resources/static/hotjar-recorder.js`)
   - `HotjarRecorder` class - Captures and sends user events to the backend
   - Records: mouse movement, clicks, scrolls, keyboard input, window resize

2. **Demo Page** (`src/main/resources/static/demo.html`)
   - Interactive test page with buttons, input fields, and clickable elements

## API Endpoints

### POST `/api/recording/start`
Starts a new recording session.

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

### POST `/api/recording/event`
Records a user event.

**Request:**
```json
{
  "sessionId": "uuid-here",
  "timestamp": 1234567890,
  "eventType": "click",
  "eventData": "{\"x\":100,\"y\":200}"
}
```

### POST `/api/recording/end/{sessionId}`
Ends a recording session.

### GET `/api/recording/sessions`
Gets all recorded sessions.

### GET `/api/recording/session/{sessionId}`
Gets details of a specific session.

### GET `/api/recording/events/{sessionId}`
Gets all events for a session.

## How It Works

### 1. Starting a Recording

When you call `recorder.startRecording()`:
- Creates a new session on the backend
- Gets a unique session ID
- Attaches event listeners to the page
- Records the start timestamp

### 2. Capturing Events

The recorder captures these events:

- **Mouse Movement** - Throttled to 50ms intervals
  - Captures x, y coordinates (client and page)

- **Clicks** - Records every click
  - Position, target element path, button

- **Scrolling** - Throttled to 100ms intervals
  - Scroll X and Y positions

- **Keyboard Input** - Every keypress
  - Key, code, target element

- **Window Resize** - Window dimension changes

- **Visibility Changes** - Tab switches

### 3. Storing Events

Each event is sent to the backend via REST API and stored in the database with:
- Session ID
- Timestamp (relative to session start)
- Event type
- Event data (JSON)

### 4. Replaying Sessions

You can retrieve all events for a session and replay them in order using the timestamps.

## Database Schema

### recording_sessions
- `id` - Primary key
- `session_id` - UUID
- `url` - Page URL
- `start_time` - Session start
- `end_time` - Session end
- `viewport_width` - Browser width
- `viewport_height` - Browser height
- `user_agent` - Browser info
- `event_data` - Additional metadata

### recording_events
- `id` - Primary key
- `session_id` - Foreign key to session
- `timestamp` - Milliseconds from session start
- `event_type` - Type of event (click, mousemove, etc.)
- `event_data` - JSON event details
- `created_at` - Database timestamp

## Usage

### 1. Start the Application

```bash
./gradlew bootRun
```

### 2. Open Demo Page

Navigate to: `http://localhost:8080/demo.html`

### 3. Start Recording

Click "Start Recording" button

### 4. Interact with the Page

- Move your mouse
- Click the colored boxes
- Type in the input field
- Scroll the page
- Resize the window

### 5. Stop Recording

Click "Stop Recording" button

### 6. View Sessions

Click "View All Sessions" to see recorded sessions and click on a session to view its events in the console.

## Integrating into Your Website

Add this code to any webpage:

```html
<script src="http://localhost:8080/hotjar-recorder.js"></script>
<script>
  const recorder = new HotjarRecorder('http://localhost:8080/api/recording');
  recorder.startRecording();

  // Stop recording when user leaves
  window.addEventListener('beforeunload', () => {
    recorder.stopRecording();
  });
</script>
```

## Features

✅ Mouse movement tracking
✅ Click tracking with element paths
✅ Scroll tracking
✅ Keyboard input tracking
✅ Window resize tracking
✅ Page visibility tracking
✅ Event throttling to reduce server load
✅ Session management
✅ RESTful API
✅ H2 database storage
✅ CORS enabled for cross-origin requests

## Future Enhancements

- 🔄 Session replay viewer with timeline
- 📊 Analytics dashboard
- 🎥 DOM snapshot for visual replay
- 🔥 Heatmap generation
- 📱 Mobile device detection
- 🎯 Custom event tracking
- 💾 Session filtering and search
- 🔐 Authentication and authorization
- 📈 Performance metrics
- 🌐 WebSocket for real-time streaming

## Database Access

The H2 console is enabled at: `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:file:./data/hotjar`
- Username: `sa`
- Password: (empty)

## Technologies Used

- **Backend:** Spring Boot 3.5.6, Java 21, Spring Data JPA
- **Database:** H2 (file-based)
- **Frontend:** Vanilla JavaScript (ES6+)
- **Build Tool:** Gradle