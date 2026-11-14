import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessageSchema, ServerMessage } from '../packages/shared/protocol';
import { roomStore } from './room-store';
import { ChatMessage } from '../packages/shared/types';

interface ClientSession {
  ws: WebSocket;
  roomCode?: string;
  participantId?: string;
  reactionTimestamps: number[];
  chatTimestamps: number[];
}

export const wsDebugLogs: string[] = [];

function logDebug(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  wsDebugLogs.push(line);
  if (wsDebugLogs.length > 100) wsDebugLogs.shift();
}

export function setupWebSocketServer(wss: WebSocketServer): void {
  const clientSessions = new Map<WebSocket, ClientSession>();
  const participantSockets = new Map<string, WebSocket>();

  function send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === 1 || ws.readyState === (WebSocket as any)?.OPEN) {
      try {
        const payload = JSON.stringify(message);
        ws.send(payload);
        logDebug(`SENT ${message.type} (length=${payload.length})`);
      } catch (err: any) {
        logDebug(`ERROR sending ${message.type}: ${err?.message}`);
      }
    } else {
      logDebug(`CANNOT SEND ${message.type}: readyState is ${ws.readyState}`);
    }
  }

  function broadcastToRoom(roomCode: string, message: ServerMessage, excludeWs?: WebSocket): void {
    const normalized = roomCode.toUpperCase();
    for (const [ws, session] of clientSessions.entries()) {
      if (session.roomCode === normalized && ws !== excludeWs) {
        send(ws, message);
      }
    }
  }

  function handleClientLeave(ws: WebSocket, session: ClientSession): void {
    if (session.roomCode && session.participantId) {
      participantSockets.delete(session.participantId);
      const { room, newHostId } = roomStore.removeParticipant(session.roomCode, session.participantId);

      if (room) {
        broadcastToRoom(session.roomCode, {
          type: 'presence',
          participants: room.participants,
        });

        if (newHostId) {
          const newHost = room.participants.find((p) => p.id === newHostId);
          if (newHost) {
            const handoverNotice: ChatMessage = {
              id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              senderId: 'system',
              senderName: 'Cinéo',
              senderAvatar: 'popcorn',
              text: `${newHost.name} is now the host.`,
              timestamp: Date.now(),
              isSystem: true,
            };
            broadcastToRoom(session.roomCode, { type: 'chat', message: handoverNotice });
          }
        }
      }
    }
  }

  wss.on('connection', (ws) => {
    const session: ClientSession = {
      ws,
      reactionTimestamps: [],
      chatTimestamps: [],
    };
    clientSessions.set(ws, session);
    logDebug(`NEW CLIENT CONNECTED. Active clientSessions=${clientSessions.size}, wss.clients=${wss.clients.size}`);

    ws.on('message', (raw) => {
      const rawStr = raw.toString();
      logDebug(`RECV RAW MESSAGE: ${rawStr.slice(0, 120)}`);
      try {
        const parsedJson = JSON.parse(rawStr);
        const result = ClientMessageSchema.safeParse(parsedJson);

        if (!result.success) {
          logDebug(`INVALID MESSAGE: ${JSON.stringify(result.error.format())}`);
          return;
        }

        const msg = result.data;
        logDebug(`PARSED VALID MESSAGE: type=${msg.type}`);

        // Handle Ping immediately for NTP synchronization
        if (msg.type === 'ping') {
          send(ws, {
            type: 'pong',
            clientTs: msg.clientTs,
            serverTs: Date.now(),
          });
          return;
        }

        // Handle Join
        if (msg.type === 'join') {
          const { roomCode, roomTitle, participantId, name, avatar, movieModeMic, agreed18Plus } = msg;
          console.log(`[Cinéo WS] Participant "${name}" (${participantId}) joining room "${roomCode}"`);

          if (!agreed18Plus) {
            send(ws, { type: 'error', message: '18+ or parental permission is required to enter.' });
            return;
          }

          session.roomCode = roomCode.toUpperCase();
          session.participantId = participantId;
          participantSockets.set(participantId, ws);

          const { room, isNewHost } = roomStore.addParticipant(session.roomCode, {
            id: participantId,
            name,
            avatar,
            movieModeMic,
            roomTitle,
          });

          // Send full room state to the newly joined client
          send(ws, {
            type: 'room:init',
            state: room,
            yourId: participantId,
          });

          // Broadcast updated presence to all other peers in the room
          broadcastToRoom(
            session.roomCode,
            {
              type: 'presence',
              participants: room.participants,
            },
            ws
          );

          // System notification
          const joinNotice: ChatMessage = {
            id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId: 'system',
            senderName: 'Cinéo',
            senderAvatar: 'popcorn',
            text: `${name} joined the room.${isNewHost ? ' (Host)' : ''}`,
            timestamp: Date.now(),
            isSystem: true,
          };
          broadcastToRoom(session.roomCode, { type: 'chat', message: joinNotice });
          return;
        }

        // For all other actions, verify active room session
        if (!session.roomCode || !session.participantId) {
          return;
        }

        const currentRoom = roomStore.getRoom(session.roomCode);
        if (!currentRoom) return;

        switch (msg.type) {
          case 'leave': {
            handleClientLeave(ws, session);
            break;
          }

          case 'ready': {
            const updated = roomStore.setParticipantReady(session.roomCode, session.participantId, msg.ready);
            if (updated) {
              broadcastToRoom(session.roomCode, { type: 'presence', participants: updated });
            }
            break;
          }

          case 'source:set': {
            const updatedSource = roomStore.updateSource(session.roomCode, msg.source);
            if (updatedSource) {
              broadcastToRoom(session.roomCode, { type: 'source:sync', source: updatedSource });
              const room = roomStore.getRoom(session.roomCode);
              if (room) {
                broadcastToRoom(session.roomCode, { type: 'player:sync', player: room.player });
                broadcastToRoom(session.roomCode, { type: 'presence', participants: room.participants });
              }
            }
            break;
          }

          case 'play': {
            const updatedPlayer = roomStore.updatePlayerState(session.roomCode, {
              playing: true,
              position: msg.position,
            });
            if (updatedPlayer) {
              broadcastToRoom(session.roomCode, { type: 'player:sync', player: updatedPlayer });
            }
            break;
          }

          case 'pause': {
            const updatedPlayer = roomStore.updatePlayerState(session.roomCode, {
              playing: false,
              position: msg.position,
            });
            if (updatedPlayer) {
              broadcastToRoom(session.roomCode, { type: 'player:sync', player: updatedPlayer });
            }
            break;
          }

          case 'seek': {
            const updatedPlayer = roomStore.updatePlayerState(session.roomCode, {
              position: msg.position,
            });
            if (updatedPlayer) {
              broadcastToRoom(session.roomCode, { type: 'player:sync', player: updatedPlayer });
            }
            break;
          }

          case 'countdown:start': {
            const countdown = roomStore.startCountdown(session.roomCode, msg.durationSeconds);
            if (countdown) {
              broadcastToRoom(session.roomCode, { type: 'countdown:started', countdown });
              setTimeout(() => {
                const r = roomStore.getRoom(session.roomCode!);
                if (r && r.countdown?.active) {
                  r.countdown = null;
                  const p = roomStore.updatePlayerState(session.roomCode!, {
                    playing: true,
                    position: r.player.position,
                  });
                  if (p) {
                    broadcastToRoom(session.roomCode!, { type: 'player:sync', player: p });
                  }
                }
              }, msg.durationSeconds * 1000);
            }
            break;
          }

          case 'break:start': {
            const breakState = roomStore.startBreak(session.roomCode, msg.durationMinutes);
            if (breakState) {
              broadcastToRoom(session.roomCode, { type: 'break:sync', breakState });
              const r = roomStore.getRoom(session.roomCode);
              if (r) {
                broadcastToRoom(session.roomCode, { type: 'player:sync', player: r.player });
              }
            }
            break;
          }

          case 'break:end': {
            roomStore.endBreak(session.roomCode);
            broadcastToRoom(session.roomCode, { type: 'break:sync', breakState: null });
            break;
          }

          case 'chat': {
            const now = Date.now();
            session.chatTimestamps = session.chatTimestamps.filter((t) => now - t < 1000);
            if (session.chatTimestamps.length >= 10) {
              return;
            }
            session.chatTimestamps.push(now);

            const sender = currentRoom.participants.find((p) => p.id === session.participantId);
            if (!sender) return;

            const chatMsg: ChatMessage = {
              id: `msg-${now}-${Math.random().toString(36).slice(2, 6)}`,
              senderId: sender.id,
              senderName: sender.name,
              senderAvatar: sender.avatar,
              text: msg.text.trim(),
              timestamp: now,
            };

            broadcastToRoom(session.roomCode, { type: 'chat', message: chatMsg });
            break;
          }

          case 'react': {
            const now = Date.now();
            session.reactionTimestamps = session.reactionTimestamps.filter((t) => now - t < 1000);
            if (session.reactionTimestamps.length >= 5) {
              return;
            }
            session.reactionTimestamps.push(now);

            broadcastToRoom(session.roomCode, {
              type: 'react',
              reaction: {
                id: `rx-${now}-${Math.random().toString(36).slice(2, 6)}`,
                senderId: session.participantId,
                emoji: msg.emoji,
                timestamp: now,
              },
            });
            break;
          }

          case 'hand': {
            const updated = roomStore.setHandRaised(session.roomCode, session.participantId, msg.raised);
            if (updated) {
              broadcastToRoom(session.roomCode, { type: 'presence', participants: updated });
            }
            break;
          }

          case 'media:toggle': {
            const updated = roomStore.setMediaToggle(session.roomCode, session.participantId, {
              isMuted: msg.isMuted,
              cameraOn: msg.cameraOn,
            });
            if (updated) {
              broadcastToRoom(session.roomCode, { type: 'presence', participants: updated });
            }
            break;
          }

          case 'rtc:signal': {
            const targetWs = participantSockets.get(msg.targetPeerId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              send(targetWs, {
                type: 'rtc:signal',
                fromPeerId: session.participantId,
                signal: msg.signal,
              });
            }
            break;
          }
        }
      } catch (err: any) {
        logDebug(`EXCEPTION in message handler: ${err?.message}`);
      }
    });

    ws.on('close', (code, reason) => {
      logDebug(`CLIENT DISCONNECTED (code=${code}, reason="${reason.toString()}")`);
      handleClientLeave(ws, session);
      clientSessions.delete(ws);
    });

    ws.on('error', (err) => {
      logDebug(`WS ERROR for client: ${err?.message}`);
      handleClientLeave(ws, session);
      clientSessions.delete(ws);
    });
  });
}

