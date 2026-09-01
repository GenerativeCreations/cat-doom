// Zero-dependency static server for CatDoom (Railway / any Node host). `node server.js` → http://localhost:PORT
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = Number(process.env.PORT) || 5347;
// Loopback only when run by hand; a platform that injects PORT (Railway) gets all interfaces.
const ON_PLATFORM = !!(process.env.PORT || process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME);
const HOST = process.env.HOST || (ON_PLATFORM ? '0.0.0.0' : '127.0.0.1');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
const SERVE_EXT = new Set(Object.keys(MIME));                               // only these file types are ever served
const DENY = /(^|\/)(server\.js|package\.json|railway\.json|README\.md|tools|levels\/\.|\.[^/]*)(\/|$)/; // dev files and dotfiles
const SECURITY = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
function send(res, code, body, headers) { res.writeHead(code, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }, SECURITY, headers || {})); res.end(body); }
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed', { Allow: 'GET, HEAD' });
  let p; try { p = decodeURIComponent((req.url || '/').split('?')[0]); } catch (_) { return send(res, 400, 'bad request'); }
  if (p === '/healthz') return send(res, 200, 'ok', { 'Cache-Control': 'no-store' });
  if (p === '/') p = '/index.html';
  if (p.includes('\0') || DENY.test(p)) return send(res, 404, 'not found');
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep) || !SERVE_EXT.has(path.extname(file))) return send(res, 404, 'not found');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'not found');
    const headers = Object.assign({ 'Content-Type': MIME[path.extname(file)], 'Content-Length': st.size, 'Cache-Control': path.extname(file) === '.html' ? 'no-cache' : 'public, max-age=600' }, SECURITY);
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res);
  });
});
server.headersTimeout = 15000; server.requestTimeout = 15000; server.keepAliveTimeout = 5000; server.maxHeadersCount = 50;
server.listen(PORT, HOST, () => console.log('CatDoom listening on http://' + HOST + ':' + PORT + (ON_PLATFORM ? ' (platform)' : ' (local, loopback)')));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
