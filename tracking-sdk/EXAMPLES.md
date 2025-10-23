# Usage Examples

## Client-Side Integration Examples

### 1. Basic HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>

  <!-- Add the async loader -->
  <script
    async
    src="https://cdn.yoursite.com/loader.min.js"
    data-site-id="your-site-id"
    data-endpoint="https://analytics.yoursite.com/v1/ingest"
    data-sdk-url="https://cdn.yoursite.com/sdk.min.js"
  ></script>
</head>
<body>
  <button onclick="hj('track', 'cta_clicked', { location: 'header' })">
    Sign Up
  </button>
</body>
</html>
```

### 2. React Integration

```jsx
// App.jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Wait for tracker to load
    const checkTracker = setInterval(() => {
      if (window.hj?._loaded) {
        clearInterval(checkTracker);

        // Configure tracker
        hj('config', {
          debug: process.env.NODE_ENV === 'development',
          sampleRate: 1.0,
        });

        console.log('Tracker loaded!');
      }
    }, 100);

    return () => clearInterval(checkTracker);
  }, []);

  const handleSignUp = () => {
    // Track custom event
    hj('track', 'signup_started', {
      source: 'homepage',
      plan: 'free'
    });

    // Your signup logic...
  };

  const handleLogin = (userId) => {
    // Identify user
    hj('identify', userId, {
      plan: 'premium',
      signupDate: new Date().toISOString()
    });
  };

  return (
    <div>
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
}

export default App;
```

### 3. Vue.js Integration

```vue
<!-- App.vue -->
<template>
  <div>
    <button @click="trackPurchase">Buy Now</button>
  </div>
</template>

<script>
export default {
  mounted() {
    // Wait for tracker
    this.$nextTick(() => {
      if (window.hj) {
        hj('config', { debug: true });
      }
    });
  },

  methods: {
    trackPurchase() {
      hj('track', 'purchase_initiated', {
        productId: 'prod-123',
        amount: 99.99,
        currency: 'USD'
      });
    }
  }
}
</script>
```

### 4. GDPR Consent Management

```html
<!-- Cookie consent banner -->
<div id="cookie-banner">
  <p>We use analytics to improve your experience.</p>
  <button onclick="acceptAnalytics()">Accept</button>
  <button onclick="rejectAnalytics()">Reject</button>
</div>

<script>
  // Check if user previously consented
  const hasConsented = localStorage.getItem('analytics-consent');

  if (hasConsented === 'true') {
    hj('consent', true);
    hideBanner();
  } else if (hasConsented === 'false') {
    hj('consent', false);
    hideBanner();
  }

  function acceptAnalytics() {
    localStorage.setItem('analytics-consent', 'true');
    hj('consent', true);
    hideBanner();
  }

  function rejectAnalytics() {
    localStorage.setItem('analytics-consent', 'false');
    hj('consent', false);
    hideBanner();
  }

  function hideBanner() {
    document.getElementById('cookie-banner').style.display = 'none';
  }
</script>
```

### 5. E-commerce Tracking

```javascript
// Track product views
function trackProductView(product) {
  hj('track', 'product_viewed', {
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: product.price
  });
}

// Track add to cart
function trackAddToCart(product, quantity) {
  hj('track', 'add_to_cart', {
    productId: product.id,
    quantity: quantity,
    price: product.price,
    total: product.price * quantity
  });
}

// Track checkout
function trackCheckout(cart) {
  hj('track', 'checkout_started', {
    itemCount: cart.items.length,
    totalAmount: cart.total,
    currency: 'USD'
  });
}

// Track purchase
function trackPurchase(order) {
  hj('track', 'purchase_completed', {
    orderId: order.id,
    amount: order.total,
    currency: 'USD',
    items: order.items.length,
    paymentMethod: order.paymentMethod
  });
}
```

### 6. Form Tracking with Sensitive Fields

```html
<form id="signup-form">
  <!-- This will be tracked -->
  <input type="text" name="username" placeholder="Username">

  <!-- This will be masked (type="email") -->
  <input type="email" name="email" placeholder="Email">

  <!-- This will be masked (type="password") -->
  <input type="password" name="password" placeholder="Password">

  <!-- This will be masked (data-mask attribute) -->
  <input type="text" name="ssn" data-mask placeholder="SSN">

  <!-- This will be masked (custom class) -->
  <input type="text" name="credit-card" class="sensitive" placeholder="Card Number">

  <button type="submit">Sign Up</button>
</form>

<script>
  // Configure custom mask selectors
  hj('config', {
    maskSelectors: ['.sensitive', '[name="ssn"]']
  });

  // Track form submission
  document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();

    hj('track', 'signup_form_submitted', {
      timestamp: Date.now()
    });
  });
</script>
```

### 7. SPA Route Tracking (React Router Example)

```jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // The SDK automatically tracks route changes via history API
    // But you can also manually track with metadata
    hj('track', 'page_viewed', {
      path: location.pathname,
      search: location.search,
      hash: location.hash
    });
  }, [location]);
}

// Use in your App component
function App() {
  usePageTracking();

  return (
    <Router>
      {/* Your routes */}
    </Router>
  );
}
```

### 8. Advanced Configuration

```javascript
// Dynamic sampling based on user type
function configureSampling(user) {
  if (user.isPremium) {
    // Track 100% of premium users
    hj('config', { sampleRate: 1.0 });
  } else {
    // Track 10% of free users
    hj('config', { sampleRate: 0.1 });
  }
}

// Disable specific tracking types
hj('config', {
  trackClicks: true,
  trackScrolls: false,  // Disable scroll tracking
  trackInputs: true,
  trackErrors: true,
  trackPerformance: true
});

// Adjust batch settings for high-traffic sites
hj('config', {
  batchInterval: 5000,   // Send every 5 seconds instead of 3
  maxBatchSize: 100      // Batch up to 100 events
});
```

## Server-Side Examples

### 1. Node.js/Express Backend with PostgreSQL

```javascript
import express from 'express';
import pako from 'pako';
import { Pool } from 'pg';
import { eventBatchSchema } from './validation';

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use('/v1/ingest', express.raw({
  type: 'application/gzip',
  limit: '10mb'
}));

app.post('/v1/ingest', async (req, res) => {
  try {
    // Decompress
    const decompressed = pako.ungzip(req.body, { to: 'string' });
    const data = JSON.parse(decompressed);

    // Validate
    const batch = eventBatchSchema.parse(data);

    // Store in database
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const event of batch.events) {
        await client.query(
          `INSERT INTO events (
            site_id, session_id, user_id, event_type,
            event_data, url, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7/1000.0))`,
          [
            batch.siteId,
            event.sessionId,
            event.userId || null,
            event.type,
            JSON.stringify(event),
            event.url,
            event.timestamp
          ]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.status(202).json({
      success: true,
      eventsProcessed: batch.events.length
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3001, () => {
  console.log('Analytics server running on port 3001');
});
```

### 2. ClickHouse Integration

```javascript
import { ClickHouse } from 'clickhouse';

const clickhouse = new ClickHouse({
  url: 'http://localhost',
  port: 8123,
  debug: false,
  basicAuth: {
    username: 'default',
    password: '',
  },
  format: 'json'
});

async function storeInClickHouse(batch) {
  const rows = batch.events.map(event => ({
    site_id: batch.siteId,
    session_id: event.sessionId,
    user_id: event.userId || '',
    event_type: event.type,
    event_data: JSON.stringify(event),
    url: event.url,
    timestamp: new Date(event.timestamp),
    user_agent: batch.metadata.userAgent,
    language: batch.metadata.language,
    timezone: batch.metadata.timezone,
    screen_width: batch.metadata.screen.width,
    screen_height: batch.metadata.screen.height,
  }));

  await clickhouse.insert('INSERT INTO events', rows).toPromise();
}
```

### 3. Rate Limiting & Authentication

```javascript
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests'
});

app.use('/v1/ingest', limiter);

// Simple API key authentication
const VALID_SITE_IDS = new Set([
  'site-123',
  'site-456',
  // Add your site IDs
]);

function validateSiteId(req, res, next) {
  const { siteId } = req.body;

  if (!VALID_SITE_IDS.has(siteId)) {
    return res.status(401).json({ error: 'Invalid site ID' });
  }

  next();
}

app.post('/v1/ingest', validateSiteId, async (req, res) => {
  // Handle request
});
```

### 4. Data Retention & Cleanup

```javascript
import cron from 'node-cron';

// Delete events older than 90 days, daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    await pool.query(`
      DELETE FROM events
      WHERE timestamp < NOW() - INTERVAL '90 days'
    `);
    console.log('Old events cleaned up');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});
```

### 5. GDPR Data Deletion Endpoint

```javascript
app.delete('/v1/users/:userId/data', async (req, res) => {
  const { userId } = req.params;

  try {
    // Delete all user data
    await pool.query(
      'DELETE FROM events WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'User data deleted'
    });
  } catch (error) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});
```

## TypeScript Usage

```typescript
// types.ts
import type { HJApi } from 'hotjar-like-tracker';

declare global {
  interface Window {
    hj: HJApi;
  }
}

// app.ts
function trackEvent() {
  if (window.hj) {
    window.hj('track', 'custom_event', {
      property: 'value'
    });
  }
}
```

## Testing Examples

```javascript
// test-tracker.js
describe('Analytics Tracker', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Mock navigator.sendBeacon
    global.navigator.sendBeacon = jest.fn(() => true);
  });

  it('should track pageview on initialization', () => {
    // Test implementation
  });

  it('should batch events', async () => {
    // Test implementation
  });

  it('should mask sensitive inputs', () => {
    // Test implementation
  });
});
```