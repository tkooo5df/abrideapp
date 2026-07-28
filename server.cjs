const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

const staticOptions = {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
};

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    distExists: fs.existsSync(distPath),
    port,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  });
});

app.get('/test', (req, res) => {
  res.status(200).send('Server is running!');
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, staticOptions));
}

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', `"${Date.now()}"`);
    res.sendFile(indexPath);
    return;
  }

  res.status(404).json({
    error: 'Application not built properly',
    message: 'dist/index.html not found',
    requestedPath: req.url,
    distPath,
    distExists: fs.existsSync(distPath),
  });
});

app.use((err, req, res, _next) => {
  console.error('Server error', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const server = app.listen(port, '0.0.0.0');

server.on('error', (err) => {
  console.error('Server failed to start', err);
  process.exit(1);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
});
