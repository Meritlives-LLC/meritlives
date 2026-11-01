// Disposable GET-only fixtures. POSTs are rejected; no database is used.
const http = require('node:http');
const service = { id: 1, name: 'Web Development', slug: 'web-development', status: 'published', description: '', short_description: '', seo: {} };
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(JSON.stringify({ message: 'Writes are forbidden in this fixture server.' })); }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/api/v1/services/web-development') return res.end(JSON.stringify({ data: service }));
  if (path === '/api/v1/search') return res.end(JSON.stringify({ data: { news: [], blog: [], products: [], services: [] } }));
  res.end(JSON.stringify({ data: path === '/api/v1/services' ? [service] : [], meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 } }));
});
server.listen(3139, '127.0.0.1', () => console.log('GET-only fixture API ready on http://127.0.0.1:3139/api/v1'));
