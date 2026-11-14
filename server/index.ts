import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './ws-handler';

const PORT = parseInt(process.env.WS_PORT || process.env.PORT || '3001', 10);
const wss = new WebSocketServer({ port: PORT });
setupWebSocketServer(wss);

console.log(`[Cinéo Realtime Server] Listening on port ${PORT}`);
