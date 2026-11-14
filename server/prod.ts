import http from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer, wsDebugLogs } from './ws-handler';

const dev = false;
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  const wss = new WebSocketServer({ noServer: true });
  setupWebSocketServer(wss);

  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);

    // Fast health probe for monitoring & Render health checks
    if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/ws-health') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'cineo-unified-prod',
          wsActive: true,
          wsClients: wss.clients.size,
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: Date.now(),
        })
      );
      return;
    }

    if (parsedUrl.pathname === '/debug-ws') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      res.end(
        JSON.stringify({
          status: 'ok',
          wsClients: wss.clients.size,
          logs: wsDebugLogs,
        }, null, 2)
      );
      return;
    }

    handle(req, res, parsedUrl);
  });

  server.on('upgrade', (req, socket, head) => {
    console.log(`[Cinéo WS] Incoming upgrade request: url=${req.url} origin=${req.headers.origin || 'unknown'}`);
    socket.on('error', (err) => {
      console.error('[Cinéo WS Socket Error]', err.message);
    });

    wss.handleUpgrade(req, socket, head, (ws) => {
      console.log('[Cinéo WS] Client upgrade handshake completed successfully');
      wss.emit('connection', ws, req);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cinéo] Production server listening on 0.0.0.0:${PORT} (Web + WS unified)`);
  });
});

