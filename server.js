const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  if (url.pathname === '/api/todos' && method === 'GET') {
    const todos = await db.getAll();
    return sendJSON(res, 200, todos);
  }

  if (url.pathname === '/api/todos' && method === 'POST') {
    try {
      const body = await readBody(req);
      await db.create(body);
      return sendJSON(res, 201, { ok: true });
    } catch {
      return sendJSON(res, 400, { error: 'invalid body' });
    }
  }

  if (url.pathname.startsWith('/api/todos/') && method === 'PATCH') {
    const id = url.pathname.slice('/api/todos/'.length);
    try {
      const body = await readBody(req);
      await db.update(id, body);
      return sendJSON(res, 200, { ok: true });
    } catch {
      return sendJSON(res, 400, { error: 'invalid body' });
    }
  }

  if (url.pathname.startsWith('/api/todos/') && method === 'DELETE') {
    const id = url.pathname.slice('/api/todos/'.length);
    await db.remove(id);
    return sendJSON(res, 200, { ok: true });
  }

  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (e2, d2) => {
        if (e2) {
          res.writeHead(500);
          return res.end('500');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

db.init().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`feifan-todo running on port ${PORT}`);
  });
}).catch(err => {
  console.error('db init failed:', err);
  process.exit(1);
});
