# Quick Start Guide

Get the tracking system up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Installation

```bash
# Navigate to the tracking SDK directory
cd tracking-sdk

# Install dependencies
npm install
```

## Build & Run

### Option 1: Run Everything (Recommended for Testing)

```bash
# Terminal 1: Build the SDK
npm run build

# Terminal 2: Start backend server
npm run dev:backend

# Terminal 3: Start demo app
npm run dev:demo
```

Then open http://localhost:3000 in your browser.

### Option 2: Just Build

```bash
# Build SDK and loader
npm run build

# Output files will be in dist/
# - dist/loader.min.js (~2KB gzipped)
# - dist/sdk.min.js (~35KB gzipped)
```

## Quick Test

After running the demo:

1. **Open browser console** to see tracked events
2. **Click buttons** to trigger click events
3. **Scroll the page** to trigger scroll depth events
4. **Type in inputs** to trigger input events (notice email/password are masked)
5. **Navigate SPA routes** to trigger route change events
6. **Click "Trigger Error"** to test error tracking

Check the **backend terminal** to see received event batches!

## Integration in Your Site

### Step 1: Copy Built Files

Copy these files to your CDN or static file server:
- `dist/loader.min.js`
- `dist/sdk.min.js`

### Step 2: Add Snippet to Your HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your Site</title>

  <!-- Add this snippet -->
  <script
    async
    src="/path/to/loader.min.js"
    data-site-id="your-site-id"
    data-endpoint="http://localhost:3001/v1/ingest"
    data-sdk-url="/path/to/sdk.min.js"
  ></script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

### Step 3: Track Custom Events

```javascript
// Track a custom event
hj('track', 'button_clicked', {
  buttonId: 'signup',
  location: 'header'
});

// Identify a user
hj('identify', 'user-123', {
  email: 'user@example.com',
  plan: 'premium'
});
```

## What Gets Tracked Automatically?

The SDK automatically tracks:

- ✅ **Pageviews** - Every page load
- ✅ **Clicks** - All user clicks (with element details)
- ✅ **Scrolls** - Scroll depth at 10% intervals
- ✅ **Inputs** - Form inputs (with automatic masking for passwords/emails)
- ✅ **Route Changes** - SPA navigation
- ✅ **Errors** - JavaScript errors and unhandled promise rejections
- ✅ **Performance** - Page load metrics (DNS, TTFB, FCP, LCP)
- ✅ **Heartbeats** - Session duration every 30 seconds

## Privacy Features

### Automatic Masking

These inputs are **automatically masked**:
- `<input type="password">`
- `<input type="email">`
- `<input type="tel">`
- Elements with `data-mask` attribute
- Elements with `class="sensitive"`

### PII Scrubbing

The backend automatically removes:
- Social Security Numbers
- Credit card numbers
- Email addresses
- Phone numbers
- IP addresses

### GDPR Consent

```javascript
// Grant consent
hj('consent', true);

// Revoke consent (clears event queue)
hj('consent', false);
```

## Viewing Tracked Events

### In Browser Console

With debug mode enabled:
```javascript
hj('config', { debug: true });
```

You'll see logs like:
```
[Tracker] Event queued: click {...}
[Tracker] Sending batch: 5 events
```

### On Backend

Events are logged to the terminal and stored in:
```
data/events/{site-id}.jsonl
```

Each line is a JSON event:
```json
{"type":"pageview","timestamp":1234567890,"sessionId":"...","url":"..."}
{"type":"click","timestamp":1234567891,"target":{"tagName":"button",...}}
```

### In Database (Production)

See `backend/server.ts` for PostgreSQL and ClickHouse examples.

## Configuration Options

```javascript
hj('config', {
  debug: true,              // Enable console logging
  sampleRate: 0.5,          // Track 50% of sessions
  trackClicks: true,        // Track clicks
  trackScrolls: true,       // Track scrolls
  trackInputs: true,        // Track inputs
  trackErrors: true,        // Track errors
  trackPerformance: true,   // Track performance metrics
  batchInterval: 3000,      // Send batches every 3s
  maxBatchSize: 50,         // Max 50 events per batch
  maskSelectors: [          // Additional selectors to mask
    '.my-sensitive-field',
    '[data-private]'
  ]
});
```

## File Sizes

After building, check the sizes:

```bash
# List built files with sizes
ls -lh dist/

# Should see:
# loader.min.js    ~2KB
# sdk.min.js       ~35KB
```

Total first load: **~37KB gzipped**

## Troubleshooting

### SDK Not Loading

Check browser console for errors:
- Ensure `data-site-id` is set
- Verify file paths are correct
- Check network tab for 404s

### Events Not Sending

- Backend must be running on correct port
- Check `data-endpoint` URL
- Enable debug mode: `hj('config', { debug: true })`
- Check browser console for errors
- Verify CORS settings

### Backend Not Receiving Events

- Check backend is running: `http://localhost:3001/health`
- Check firewall/network settings
- Verify Content-Type headers
- Check backend logs for validation errors

## Next Steps

1. ✅ **Test locally** with the demo
2. ✅ **Integrate** into your website
3. ✅ **Set up database** (PostgreSQL or ClickHouse)
4. ✅ **Deploy backend** to production
5. ✅ **Upload SDK files** to CDN
6. ✅ **Configure** sampling and privacy settings
7. ✅ **Build analytics dashboard** to visualize data

## Support

For detailed examples, see:
- `README.md` - Full documentation
- `EXAMPLES.md` - Integration examples
- `demo/index.html` - Working demo

## Production Deployment

See README.md for production checklist including:
- Database setup
- Authentication
- Rate limiting
- CORS configuration
- Data retention
- GDPR compliance