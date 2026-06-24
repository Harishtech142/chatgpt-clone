import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Check if the build directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error("Error: The 'dist' directory does not exist. Please run 'npm run build' before starting the production server.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Normalize and decode URL-encoded paths to prevent directory traversal
  let safeUrl = req.url;
  try {
    safeUrl = decodeURIComponent(req.url);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  // Strip query parameters
  const pathName = safeUrl.split('?')[0];
  let filePath = path.join(DIST_DIR, pathName);

  // If a directory is requested, serve index.html from that directory
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Fallback to the root index.html for client-side routing (SPA fallback)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support standard cache control headers for production optimization
    const headers = { 'Content-Type': contentType };
    if (ext !== '.html') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(parseInt(String(PORT)), '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}/`);
});
