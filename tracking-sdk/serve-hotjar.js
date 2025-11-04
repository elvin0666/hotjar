/**
 * Simple static file server for hotjar.js
 * Serves on port 8080 for cross-project usage
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all origins (manually)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Specific route for hotjar.js
app.get('/hotjar.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'hotjar.min.js'));
});

// Serve demo HTML
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo-standalone.html'));
});

app.listen(PORT, () => {
  console.log(`[Hotjar Server] Running on http://localhost:${PORT}`);
  console.log(`[Hotjar Server] hotjar.js available at http://localhost:${PORT}/hotjar.js`);
  console.log(`[Hotjar Server] Demo page at http://localhost:${PORT}/demo`);
});
