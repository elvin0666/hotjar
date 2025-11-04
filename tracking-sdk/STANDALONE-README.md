# Standalone Hotjar Script

A self-contained, auto-starting analytics tracking script that can be easily embedded in any project without additional setup or dependencies.

## Features

- **Single-file, self-starting** - No configuration needed, just drop it in
- **Safe multi-inclusion** - Can be loaded multiple times without side effects
- **Auto-start with flexible controls** - Starts automatically or manually based on your needs
- **CSP-safe** - No eval, no inline scripts required
- **No external dependencies** - Everything bundled in one file
- **Public API** - Full control with `HJ.init()`, `HJ.start()`, `HJ.stop()`, etc.
- **Privacy-first** - Automatic PII masking and consent management
- **Small footprint** - ~10KB minified, ~3KB gzipped

## Quick Start

### 1. Build the Script

```bash
cd tracking-sdk
npm install
npm run build:standalone
```

This generates:
- `dist/hotjar.js` - Development version (readable, ~23KB)
- `dist/hotjar.min.js` - Production version (minified, ~10KB)

### 2. Serve on Port 8080

Start the server to make hotjar.js available at `http://localhost:8080`:

```bash
npm run serve:hotjar
```

This will serve:
- `http://localhost:8080/hotjar.js` - Minified script
- `http://localhost:8080/demo` - Demo page

### 3. Include in Any Project

Add to any HTML file:

```html
<script src="http://localhost:8080/hotjar.js"></script>
```

That's it! The tracker will auto-start with default settings.

## Usage Examples

### Example 1: Basic Auto-Start (Default)

```html
<!-- Just include the script - it auto-starts -->
<script src="http://localhost:8080/hotjar.js"></script>
```

The tracker will:
- Auto-start immediately (or when DOM is ready)
- Use default configuration
- Track pageviews, clicks, scrolls, inputs, errors, performance

### Example 2: Auto-Start with Custom Config

```html
<!-- Define config before loading the script -->
<script>
  window.HJ_CONFIG = {
    projectId: "my-project-123",
    endpoint: "http://localhost:3001/v1/ingest",
    debug: true,
    trackClicks: true,
    trackScrolls: true,
    trackInputs: true,
    trackErrors: true,
    trackPerformance: true
  };
</script>
<script src="http://localhost:8080/hotjar.js"></script>
```

### Example 3: Disable Auto-Start

```html
<!-- Disable auto-start, initialize manually -->
<script>
  window.HJ_AUTO_START = false;
</script>
<script src="http://localhost:8080/hotjar.js"></script>
<script>
  // Start manually when ready
  HJ.start();
</script>
```

### Example 4: URL Parameter Trigger

If the URL contains `?hj=1`, the tracker will auto-start even without config:

```
https://myapp.com/page?hj=1
```

### Example 5: Using Public API

```html
<script src="http://localhost:8080/hotjar.js"></script>
<script>
  // Initialize with config
  HJ.init({
    projectId: "my-project",
    endpoint: "http://localhost:3001/v1/ingest",
    debug: true
  });

  // Track custom events
  HJ.track('purchase', {
    amount: 99.99,
    currency: 'USD',
    productId: 'prod-123'
  });

  // Identify user
  HJ.identify('user-12345', {
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'premium'
  });

  // Manage consent (GDPR)
  HJ.consent(false); // Revoke consent
  HJ.consent(true);  // Grant consent

  // Update config on the fly
  HJ.config({ debug: false });

  // Stop tracking
  HJ.stop();
</script>
```

## Public API Reference

### `HJ.init(config)`

Initialize the tracker with configuration.

**Parameters:**
- `config` (object): Configuration options

**Example:**
```javascript
HJ.init({
  projectId: "my-project-123",
  endpoint: "http://localhost:3001/v1/ingest",
  debug: true,
  sampleRate: 1,              // 0-1, default 1 (100%)
  maskSelectors: ['.private'], // Additional CSS selectors to mask
  trackClicks: true,
  trackScrolls: true,
  trackInputs: true,
  trackErrors: true,
  trackPerformance: true,
  batchInterval: 3000,        // ms between batch sends
  maxBatchSize: 50,           // max events per batch
  consent: true               // GDPR consent
});
```

### `HJ.start()`

Start tracking with `window.HJ_CONFIG` or default settings.

**Example:**
```javascript
window.HJ_CONFIG = { projectId: "my-project" };
HJ.start();
```

### `HJ.stop()`

Stop tracking and flush remaining events.

**Example:**
```javascript
HJ.stop();
```

### `HJ.track(eventName, properties)`

Track a custom event.

**Parameters:**
- `eventName` (string): Event name
- `properties` (object, optional): Event properties

**Example:**
```javascript
HJ.track('button_click', {
  button: 'signup',
  location: 'header'
});

HJ.track('purchase', {
  amount: 99.99,
  currency: 'USD',
  productId: 'prod-123'
});
```

### `HJ.identify(userId, traits)`

Identify a user with additional traits.

**Parameters:**
- `userId` (string): Unique user identifier
- `traits` (object, optional): User traits

**Example:**
```javascript
HJ.identify('user-12345', {
  name: 'John Doe',
  email: 'john@example.com',
  plan: 'premium',
  signupDate: '2024-01-15'
});
```

### `HJ.consent(granted)`

Manage user consent (GDPR compliance).

**Parameters:**
- `granted` (boolean): Consent granted or revoked

**Example:**
```javascript
HJ.consent(false); // Revoke consent - stops tracking
HJ.consent(true);  // Grant consent - resumes tracking
```

### `HJ.config(config)`

Update configuration on the fly.

**Parameters:**
- `config` (object): Partial configuration to update

**Example:**
```javascript
HJ.config({ debug: true });
HJ.config({ trackClicks: false });
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | string | `'default'` | Project identifier |
| `siteId` | string | `projectId` | Alternative to projectId |
| `endpoint` | string | `'http://localhost:3001/v1/ingest'` | Ingestion endpoint URL |
| `sampleRate` | number | `1` | Sample rate (0-1) for tracking |
| `debug` | boolean | `false` | Enable debug logging |
| `maskSelectors` | string[] | `[]` | Additional CSS selectors to mask |
| `trackClicks` | boolean | `true` | Track click events |
| `trackScrolls` | boolean | `true` | Track scroll depth |
| `trackInputs` | boolean | `true` | Track input changes |
| `trackErrors` | boolean | `true` | Track errors and exceptions |
| `trackPerformance` | boolean | `true` | Track performance metrics |
| `batchInterval` | number | `3000` | Batch send interval (ms) |
| `maxBatchSize` | number | `50` | Max events per batch |
| `consent` | boolean | `true` | Initial consent state |

## Auto-Start Logic

The script auto-starts when:

1. **`window.HJ_AUTO_START` is not explicitly set to `false`**
2. **OR `window.HJ_CONFIG` exists** - Config provided, start tracking
3. **OR URL contains `?hj=1`** - Enable via URL parameter

To disable auto-start:
```javascript
window.HJ_AUTO_START = false;
```

## Privacy Features

### Automatic PII Masking

The following input types are automatically masked:
- `input[type="password"]`
- `input[type="email"]`
- `input[type="tel"]`
- `input[data-private]`
- `[data-mask]`
- `.sensitive`

**Custom masking:**
```javascript
HJ.init({
  maskSelectors: ['.user-info', '[data-secret]', '#credit-card']
});
```

Or add directly to HTML:
```html
<input type="text" data-mask placeholder="SSN">
<div data-mask>Sensitive content</div>
```

### GDPR Consent Management

```javascript
// Revoke consent - stops tracking immediately
HJ.consent(false);

// Grant consent - resumes tracking
HJ.consent(true);
```

## Events Tracked

The tracker automatically captures:

- **Pageviews** - Initial page load and route changes
- **Clicks** - All click events with element details
- **Scrolls** - Scroll depth at 10% intervals
- **Inputs** - Form input changes (with masking)
- **Route Changes** - SPA navigation (pushState/replaceState)
- **Errors** - JavaScript errors and unhandled promise rejections
- **Performance** - Page load metrics (DNS, TCP, TTFB, DOM, etc.)
- **Heartbeats** - Session duration tracking (every 30s)
- **Custom Events** - Your tracked events via `HJ.track()`

## Cross-Project Usage

### Setup Server on Port 8080

In the tracking-sdk project:
```bash
npm run serve:hotjar
```

### Use in Another Project

In your other project's HTML:
```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>

  <!-- Option 1: Auto-start with config -->
  <script>
    window.HJ_CONFIG = {
      projectId: "my-app",
      endpoint: "http://localhost:3001/v1/ingest",
      debug: true
    };
  </script>
  <script src="http://localhost:8080/hotjar.js"></script>
</head>
<body>
  <h1>My Application</h1>

  <!-- Option 2: Track custom events -->
  <button onclick="HJ.track('button_click', {button: 'hero-cta'})">
    Click Me
  </button>
</body>
</html>
```

## Backend Setup

The tracker needs a backend server to receive events:

### Start Backend Server (Port 3001)

```bash
cd tracking-sdk
npm run serve
```

This starts the ingestion server at `http://localhost:3001/v1/ingest`.

### Full Development Setup

Run both servers simultaneously:

```bash
# Terminal 1: Backend server (port 3001)
cd tracking-sdk
npm run serve

# Terminal 2: Hotjar.js server (port 8080)
cd tracking-sdk
npm run serve:hotjar
```

## Demo Page

Access the demo at `http://localhost:8080/demo` to see the tracker in action.

The demo includes:
- Usage examples with code snippets
- Interactive elements (buttons, inputs, scroll areas)
- Console logging of tracked events
- Session information display

## Development

### Build

```bash
cd tracking-sdk
npm run build:standalone
```

Generates:
- `dist/hotjar.js` - Development build
- `dist/hotjar.min.js` - Production build
- Source maps for both

### File Structure

```
tracking-sdk/
├── src/
│   └── standalone/
│       └── hotjar.ts          # Main standalone script
├── dist/
│   ├── hotjar.js              # Built development version
│   ├── hotjar.min.js          # Built production version
│   └── *.map                  # Source maps
├── serve-hotjar.js            # Static file server (port 8080)
├── backend/
│   └── server.ts              # Ingestion server (port 3001)
├── demo-standalone.html       # Demo page
└── rollup.config.standalone.js # Build configuration
```

## CSP (Content Security Policy)

The script is CSP-safe and doesn't use `eval()` or inline scripts.

Recommended CSP:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' http://localhost:8080;
  connect-src 'self' http://localhost:3001;
```

## Browser Support

- Modern browsers (ES6+)
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Troubleshooting

### Script Not Loading
- Ensure server is running: `npm run serve:hotjar`
- Check console for CORS errors
- Verify URL: `http://localhost:8080/hotjar.js`

### Events Not Tracking
- Check debug mode: `HJ.config({ debug: true })`
- Verify backend is running: `npm run serve`
- Check consent state: `HJ.consent(true)`
- Verify sample rate: `HJ.init({ sampleRate: 1 })`

### Backend Not Receiving Events
- Ensure backend server is running on port 3001
- Check endpoint configuration: `endpoint: "http://localhost:3001/v1/ingest"`
- Check browser console for network errors
- Verify CORS headers

## Production Deployment

### 1. Build for Production
```bash
npm run build:standalone
```

### 2. Deploy `dist/hotjar.min.js`
Upload to CDN or static hosting:
```html
<script src="https://cdn.yoursite.com/hotjar.min.js"></script>
```

### 3. Configure Backend Endpoint
```javascript
window.HJ_CONFIG = {
  projectId: "production-site",
  endpoint: "https://analytics.yoursite.com/v1/ingest",
  debug: false,
  sampleRate: 0.1  // Sample 10% of traffic
};
```

## License

MIT
