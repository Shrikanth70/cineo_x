import http from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './ws-handler';

const dev = false;
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  setupWebSocketServer(wss);

  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cinéo] Production server listening on port ${PORT}`);
  });
});
