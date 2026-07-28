const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const distPath = path.join(process.cwd(), 'dist');

const respondJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    respondJson(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port,
      distExists: fs.existsSync(distPath),
    });
    return;
  }

  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Test successful! Minimal server is working.');
    return;
  }

  if (req.url === '/') {
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexPath, 'utf8'));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
  <head>
    <title>Diagnostic Server</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Minimal Diagnostic Server Running</h1>
    <p>Server is operating on port ${port}</p>
    <p><a href="/health">Health Check</a> | <a href="/test">Test Endpoint</a></p>
    <p>Dist directory exists: ${fs.existsSync(distPath)}</p>
  </body>
</html>`);
    return;
  }

  const filePath = path.join(distPath, req.url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
    return;
  }

  respondJson(res, 404, {
    error: 'Not found',
    url: req.url,
    timestamp: new Date().toISOString(),
  });
});

server.on('error', (err) => {
  console.error('Server error', err);
  process.exit(1);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(port, '0.0.0.0');
