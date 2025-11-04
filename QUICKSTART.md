# Hotjar Standalone Script - Quick Start Guide

## What You Have Now

✅ **Compact, self-starting hotjar.js** - Single file, ready to use
✅ **Public API** - `HJ.init()`, `HJ.start()`, `HJ.stop()`, `HJ.track()`, etc.
✅ **Auto-start with flexible controls** - Starts automatically or manually
✅ **Safe for multiple includes** - Won't break if loaded multiple times
✅ **CSP-safe** - No eval, no external dependencies
✅ **Built files** - Both readable and minified versions ready

## Files Created

```
hotjar/
├── tracking-sdk/
│   ├── src/standalone/hotjar.ts          ← Source code
│   ├── dist/
│   │   ├── hotjar.js                     ← Development build (23KB)
│   │   └── hotjar.min.js                 ← Production build (10KB)
│   ├── serve-hotjar.js                   ← Server for port 8080
│   ├── demo-standalone.html              ← Demo page
│   └── STANDALONE-README.md              ← Full documentation
└── test-hotjar.html                      ← Test page (cross-project)
```

## How to Use Right Now

### Step 1: Start the Servers

```bash
# Terminal 1: Start hotjar.js server (port 8080)
cd tracking-sdk
npm run serve:hotjar

# Terminal 2: Start backend server (port 3001)
cd tracking-sdk
npm run serve
```

### Step 2: Test It

#### Option A: Open the demo page
```
http://localhost:8080/demo
```

#### Option B: Open the test page
```
file:///C:/Users/elvin_27gjxs6/hotjar/test-hotjar.html
```

#### Option C: Add to any HTML file

```html
<!-- Simplest usage - auto-start with defaults -->
<script src="http://localhost:8080/hotjar.js"></script>

<!-- Or with custom config -->
<script>
  window.HJ_CONFIG = {
    projectId: "my-project",
    endpoint: "http://localhost:3001/v1/ingest",
    debug: true
  };
</script>
<script src="http://localhost:8080/hotjar.js"></script>
```

## Usage Examples

### Example 1: Auto-start (No Config Needed)
```html
<script src="http://localhost:8080/hotjar.js"></script>
```

### Example 2: Manual Control
```html
<script>window.HJ_AUTO_START = false;</script>
<script src="http://localhost:8080/hotjar.js"></script>
<script>
  // Start when ready
  HJ.start();

  // Track events
  HJ.track('page_view', { page: 'home' });

  // Stop tracking
  HJ.stop();
</script>
```

### Example 3: Enable via URL
Add `?hj=1` to any URL:
```
https://myapp.com/page?hj=1
```

## Public API

```javascript
// Initialize with config
HJ.init({
  projectId: "my-project",
  endpoint: "http://localhost:3001/v1/ingest",
  debug: true
});

// Start tracking
HJ.start();

// Track custom events
HJ.track('purchase', { amount: 99.99, currency: 'USD' });

// Identify user
HJ.identify('user-123', { name: 'John', email: 'john@example.com' });

// Manage consent
HJ.consent(false); // Revoke
HJ.consent(true);  // Grant

// Update config
HJ.config({ debug: false });

// Stop tracking
HJ.stop();
```

## What Gets Tracked Automatically

- ✅ **Pageviews** - Initial load and SPA route changes
- ✅ **Clicks** - All click events with element details
- ✅ **Scrolls** - Scroll depth at 10% intervals
- ✅ **Inputs** - Form input changes (with PII masking)
- ✅ **Errors** - JavaScript errors and promise rejections
- ✅ **Performance** - Page load metrics
- ✅ **Heartbeats** - Session duration tracking

## Privacy Features

### Automatic PII Masking
These are automatically masked:
- `input[type="password"]`
- `input[type="email"]`
- `input[type="tel"]`

### Add Custom Masking
```html
<input data-mask placeholder="SSN">
<div data-mask>Sensitive data</div>
```

Or via config:
```javascript
HJ.init({
  maskSelectors: ['.private', '[data-secret]']
});
```

## Verify It's Working

### 1. Check Browser Console
You should see:
```
[HJ] Initialized {projectId: "...", debug: true, ...}
[HJ] Event queued: pageview {...}
[HJ] Sending batch: {...}
```

### 2. Check Backend Console
You should see:
```
[Ingest] Received batch from site my-project:
  - Events: 1
  - Event types: { pageview: 1 }
```

### 3. Check localStorage
```javascript
localStorage.getItem('__hj_session')
// Should show: {"id":"...","userId":null,"startTime":...}
```

## Production Deployment

### 1. Build
```bash
cd tracking-sdk
npm run build:standalone
```

### 2. Deploy `dist/hotjar.min.js`
Upload to your CDN:
```html
<script src="https://cdn.yoursite.com/hotjar.min.js"></script>
```

### 3. Configure Production Endpoint
```javascript
window.HJ_CONFIG = {
  projectId: "production",
  endpoint: "https://analytics.yoursite.com/v1/ingest",
  debug: false,
  sampleRate: 0.1  // Sample 10%
};
```

## Next Steps

1. ✅ **Test the demo** - `http://localhost:8080/demo`
2. ✅ **Check the README** - `tracking-sdk/STANDALONE-README.md`
3. ✅ **Integrate into your project** - Just add the script tag
4. 📊 **Set up your analytics backend** - Process incoming events
5. 🚀 **Deploy to production** - Upload to CDN

## Troubleshooting

### Script not loading?
```bash
# Ensure server is running
npm run serve:hotjar

# Check: http://localhost:8080/hotjar.js
```

### Events not tracking?
```javascript
// Enable debug mode
HJ.config({ debug: true });

// Check consent
HJ.consent(true);
```

### Backend not receiving?
```bash
# Ensure backend is running
npm run serve

# Check: http://localhost:3001/health
```

## Support

- 📖 Full docs: `tracking-sdk/STANDALONE-README.md`
- 🎯 Demo page: `http://localhost:8080/demo`
- 🧪 Test page: `test-hotjar.html`
- 💻 Source: `tracking-sdk/src/standalone/hotjar.ts`

---

**Built:** $(date)
**Size:** 10KB minified, 3KB gzipped
**Status:** ✅ Ready to use
