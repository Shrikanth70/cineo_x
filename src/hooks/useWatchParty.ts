import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  Participant,
  MediaSourceState,
  PlayerState,
  CountdownState,
  BreakState,
  ChatMessage,
  FloatingReaction,
  AvatarId,
} from '@shared/types';
import { ServerMessage, ClientMessage } from '@shared/protocol';
import { NtpClockSync } from '@/lib/ntp-sync';
import { safeStorage } from '@/lib/storage';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface UseWatchPartyOptions {
  roomCode: string;
  initialParticipantId?: string;
  autoJoin?: boolean;
  onRtcSignal?: (fromPeerId: string, signal: unknown) => void;
}

export function useWatchParty({ roomCode, initialParticipantId, onRtcSignal }: UseWatchPartyOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myId, setMyId] = useState<string>(initialParticipantId || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const onRtcSignalRef = useRef(onRtcSignal);
  useEffect(() => {
    onRtcSignalRef.current = onRtcSignal;
  }, [onRtcSignal]);

  const wsRef = useRef<WebSocket | null>(null);
  const ntpRef = useRef<NtpClockSync>(new NtpClockSync(4));
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSentJoinRef = useRef<boolean>(false);
  const joinParamsRef = useRef<{
    roomCode: string;
    participantId: string;
    name: string;
    avatar: AvatarId;
    movieModeMic: boolean;
  } | null>(null);

  const getWsUrl = useCallback(() => {
    let configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
    if (configured) {
      // Normalize https:// -> wss:// and http:// -> ws://
      if (configured.startsWith('https://')) {
        configured = 'wss://' + configured.slice(8);
      } else if (configured.startsWith('http://')) {
        configured = 'ws://' + configured.slice(7);
      } else if (!configured.startsWith('ws://') && !configured.startsWith('wss://')) {
        configured = 'wss://' + configured;
      }
      // Strip trailing slash
      return configured.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (window.location.port === '3000') {
        return `${proto}//${window.location.hostname}:3001`;
      }
      return `${proto}//${window.location.host}`;
    }
    return 'ws://localhost:3001';
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      send({ type: 'ping', clientTs: Date.now() });
    }
  }, [send]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus(reconnectAttemptsRef.current === 0 ? 'connecting' : 'reconnecting');

    try {
      const targetUrl = getWsUrl();
      console.log('[Cinéo WS Client] Attempting connection to:', targetUrl);
      const socket = new WebSocket(targetUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[Cinéo WS Client] Connected successfully to', targetUrl);
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Start NTP periodic clock sync
        ping();
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(ping, 5000);

        // Auto re-join if reconnecting with stored join credentials or saved preferences
        if (joinParamsRef.current) {
          send({
            type: 'join',
            roomCode: joinParamsRef.current.roomCode,
            participantId: joinParamsRef.current.participantId,
            name: joinParamsRef.current.name,
            avatar: joinParamsRef.current.avatar,
            agreed18Plus: true,
            movieModeMic: joinParamsRef.current.movieModeMic,
          });
        } else {
          const prefs = safeStorage.getUserPrefs();
          if (prefs.name && prefs.agreed18Plus) {
            const pId = initialParticipantId || `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setMyId(pId);
            const recent = safeStorage.getRecentParties().find((p) => p.code === roomCode);
            joinParamsRef.current = {
              roomCode,
              participantId: pId,
              name: prefs.name,
              avatar: prefs.avatar || 'popcorn',
              movieModeMic: prefs.movieModeMic || false,
            };
            send({
              type: 'join',
              roomCode,
              roomTitle: recent?.title,
              participantId: pId,
              name: prefs.name,
              avatar: prefs.avatar || 'popcorn',
              agreed18Plus: true,
              movieModeMic: prefs.movieModeMic || false,
            });
          }
        }
      };

      socket.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data);
          console.log('[Cinéo WS Client] Received message:', data.type);

          switch (data.type) {
            case 'pong': {
              const recvTs = Date.now();
              ntpRef.current.recordSample(data.clientTs, data.serverTs, recvTs);
              break;
            }

            case 'room:init': {
              setRoom(data.state);
              setMyId(data.yourId);
              setErrorNotice(null);
              // Save to recent parties
              safeStorage.addRecentParty({
                code: data.state.code,
                title: data.state.title,
                joinedAt: Date.now(),
              });
              break;
            }

            case 'room:sync': {
              setRoom(data.state);
              break;
            }

            case 'presence': {
              setRoom((prev) => (prev ? { ...prev, participants: data.participants } : null));
              break;
            }

            case 'player:sync': {
              setRoom((prev) => (prev ? { ...prev, player: data.player } : null));
              break;
            }

            case 'source:sync': {
              setRoom((prev) => (prev ? { ...prev, source: data.source } : null));
              break;
            }

            case 'countdown:started': {
              setRoom((prev) => (prev ? { ...prev, countdown: data.countdown } : null));
              break;
            }

            case 'break:sync': {
              setRoom((prev) => (prev ? { ...prev, breakState: data.breakState } : null));
              break;
            }

            case 'chat': {
              setMessages((prev) => [...prev.slice(-150), data.message]);
              break;
            }

            case 'react': {
              setFloatingReactions((prev) => [...prev.slice(-30), data.reaction]);
              // Auto-dismiss floating reaction after 2.5s
              setTimeout(() => {
                setFloatingReactions((curr) => curr.filter((r) => r.id !== data.reaction.id));
              }, 2500);
              break;
            }

            case 'error': {
              setErrorNotice(data.message);
              break;
            }

            case 'rtc:signal': {
              onRtcSignalRef.current?.(data.fromPeerId, data.signal);
              break;
            }
          }
        } catch {
          // ignore message parse error
        }
      };

      socket.onclose = (event) => {
        console.warn(`[Cinéo WS Client] Closed code=${event.code} reason="${event.reason || 'none'}" clean=${event.wasClean}`);
        setStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Do not auto-reconnect on normal intentional unmount closure
        if (event.code === 1000) return;

        // Schedule exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 8000);
        reconnectAttemptsRef.current += 1;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, delay);
      };

      socket.onerror = (err) => {
        console.error('[Cinéo WS Client] Socket error occurred:', err);
      };
    } catch {
      setStatus('disconnected');
    }
  }, [getWsUrl, ping, send, roomCode, initialParticipantId]);

  const connectRef = useRef(connect);
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Lifecycle tied ONLY to roomCode, preventing unmount loops on state updates
  useEffect(() => {
    connectRef.current();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      hasSentJoinRef.current = false;
      if (wsRef.current) {
        console.log('[Cinéo WS Client] Unmounting room session, closing socket cleanly');
        wsRef.current.close(1000, 'Room unmount');
        wsRef.current = null;
      }
    };
  }, [roomCode]);

  const join = useCallback(
    (name: string, avatar: AvatarId, agreed18Plus: boolean, movieModeMic = false) => {
      if (!agreed18Plus) {
        setErrorNotice('You must agree to the 18+ / parental permission rules.');
        return;
      }
      const participantId = myId || `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setMyId(participantId);

      joinParamsRef.current = {
        roomCode,
        participantId,
        name,
        avatar,
        movieModeMic,
      };

      safeStorage.saveUserPrefs({ name, avatar, movieModeMic, agreed18Plus });

      send({
        type: 'join',
        roomCode,
        participantId,
        name,
        avatar,
        agreed18Plus: true,
        movieModeMic,
      });
    },
    [roomCode, myId, send]
  );

  const leave = useCallback(() => {
    send({ type: 'leave' });
    joinParamsRef.current = null;
    setRoom(null);
  }, [send]);

  const toggleReady = useCallback(
    (currentReady: boolean) => {
      send({ type: 'ready', ready: !currentReady });
    },
    [send]
  );

  const setSource = useCallback(
    (source: MediaSourceState) => {
      send({ type: 'source:set', source });
    },
    [send]
  );

  const play = useCallback(
    (position: number) => {
      send({ type: 'play', position });
    },
    [send]
  );

  const pause = useCallback(
    (position: number) => {
      send({ type: 'pause', position });
    },
    [send]
  );

  const seek = useCallback(
    (position: number) => {
      send({ type: 'seek', position });
    },
    [send]
  );

  const startCountdown = useCallback(
    (durationSeconds = 3) => {
      send({ type: 'countdown:start', durationSeconds });
    },
    [send]
  );

  const startBreak = useCallback(
    (durationMinutes: number) => {
      send({ type: 'break:start', durationMinutes });
    },
    [send]
  );

  const endBreak = useCallback(() => {
    send({ type: 'break:end' });
  }, [send]);

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      send({ type: 'chat', text: text.trim().slice(0, 500) });
    },
    [send]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      send({ type: 'react', emoji });
    },
    [send]
  );

  const toggleHandRaised = useCallback(
    (currentlyRaised: boolean) => {
      send({ type: 'hand', raised: !currentlyRaised });
    },
    [send]
  );

  const toggleMedia = useCallback(
    (opts: { isMuted?: boolean; cameraOn?: boolean }) => {
      send({ type: 'media:toggle', ...opts });
    },
    [send]
  );

  const sendRtcSignal = useCallback(
    (targetPeerId: string, signal: unknown) => {
      send({ type: 'rtc:signal', targetPeerId, signal });
    },
    [send]
  );

  const currentParticipant = room?.participants.find((p) => p.id === myId) || null;
  const isHost = currentParticipant?.isHost ?? false;

  return {
    status,
    room,
    myId,
    currentParticipant,
    isHost,
    messages,
    floatingReactions,
    errorNotice,
    ntp: ntpRef.current,
    join,
    leave,
    toggleReady,
    setSource,
    play,
    pause,
    seek,
    startCountdown,
    startBreak,
    endBreak,
    sendChatMessage,
    sendReaction,
    toggleHandRaised,
    toggleMedia,
    sendRtcSignal,
    reconnect: connect,
  };
}
