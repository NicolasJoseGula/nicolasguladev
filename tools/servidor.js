// Servidor estático mínimo para mirar el sitio antes de publicarlo.
// No es parte del sitio: solo lo usa el desarrollo local.
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PORT) || 4173;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const archivo = path.join(RAIZ, rel);
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403).end('no'); return; }
  fs.readFile(archivo, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type': 'text/plain'}).end('404 ' + rel); return; }
    res.writeHead(200, {'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream'});
    res.end(buf);
  });
}).listen(PUERTO, () => console.log('sirviendo ' + RAIZ + ' en http://localhost:' + PUERTO));
