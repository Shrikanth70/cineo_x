import http from 'http';
import { parse } from 'url';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer, wsDebugLogs } from './ws-handler';

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url || '/', true);

  // Fast health probe for monitoring & Render health checks
  if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/ws-health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'cineo-realtime-backend',
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
      'Access-Control-Allow-Origin': '*',
    });
    res.end(
      JSON.stringify(
        {
          status: 'ok',
          wsClients: wss.clients.size,
          logs: wsDebugLogs,
        },
        null,
        2
      )
    );
    return;
  }

  // Redirect any direct web requests to the Vercel-hosted frontend
  res.writeHead(302, {
    Location: 'https://cineox.vercel.app',
    'Content-Type': 'text/plain',
  });
  res.end('Redirecting to Cinéo frontend at https://cineox.vercel.app\n');
});

// Configure WebSocketServer attached natively to the HTTP server
const wss = new WebSocketServer({ server });
setupWebSocketServer(wss);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Cinéo] Realtime WebSocket Server listening on 0.0.0.0:${PORT} (Node standalone)`);
});
