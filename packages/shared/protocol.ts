import { z } from 'zod';

export const AvatarIdSchema = z.enum([
  'popcorn',
  'clapper',
  'unicorn',
  'panda',
  'fox',
  'alien',
  'robot',
  'frog',
  'ghost',
  'lion',
  'octopus',
  'chili',
]);

export const FileFingerprintSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().nonnegative(),
  duration: z.number().nonnegative().optional(),
});

export const MediaSourceStateSchema = z.object({
  type: z.enum(['ott', 'youtube', 'file', 'screen']),
  url: z.string().max(2048).optional(),
  title: z.string().max(255).optional(),
  ottPlatform: z.string().max(100).optional(),
  fileFingerprint: FileFingerprintSchema.optional(),
});

export const PlayerStateSchema = z.object({
  playing: z.boolean(),
  position: z.number().nonnegative(),
  rate: z.number().positive().default(1),
  serverTs: z.number().positive(),
});

export const CountdownStateSchema = z.object({
  active: z.boolean(),
  targetTs: z.number().positive(),
  durationSeconds: z.number().positive(),
});

export const BreakStateSchema = z.object({
  active: z.boolean(),
  durationMinutes: z.number().positive(),
  endsAtTs: z.number().positive(),
});

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  avatar: AvatarIdSchema,
  isHost: z.boolean(),
  isReady: z.boolean(),
  movieModeMic: z.boolean(),
  handRaised: z.boolean(),
  isMuted: z.boolean(),
  cameraOn: z.boolean(),
  joinedAt: z.number(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatar: AvatarIdSchema,
  text: z.string().min(1).max(500),
  timestamp: z.number(),
  isSystem: z.boolean().optional(),
});

export const RoomStateSchema = z.object({
  code: z.string().min(4).max(32),
  title: z.string().min(1).max(100),
  hostId: z.string(),
  createdAt: z.number(),
  participants: z.array(ParticipantSchema),
  source: MediaSourceStateSchema,
  player: PlayerStateSchema,
  countdown: CountdownStateSchema.nullable(),
  breakState: BreakStateSchema.nullable(),
});

// Client -> Server Events
export const ClientJoinSchema = z.object({
  type: z.literal('join'),
  roomCode: z.string().min(4).max(32),
  roomTitle: z.string().max(100).optional(),
  participantId: z.string().min(1),
  name: z.string().min(1).max(40),
  avatar: AvatarIdSchema,
  agreed18Plus: z.literal(true), // Strictly enforced server-side
  movieModeMic: z.boolean().default(false),
});

export const ClientLeaveSchema = z.object({
  type: z.literal('leave'),
});

export const ClientReadySchema = z.object({
  type: z.literal('ready'),
  ready: z.boolean(),
});

export const ClientSourceSetSchema = z.object({
  type: z.literal('source:set'),
  source: MediaSourceStateSchema,
});

export const ClientPlaySchema = z.object({
  type: z.literal('play'),
  position: z.number().nonnegative(),
});

export const ClientPauseSchema = z.object({
  type: z.literal('pause'),
  position: z.number().nonnegative(),
});

export const ClientSeekSchema = z.object({
  type: z.literal('seek'),
  position: z.number().nonnegative(),
});

export const ClientCountdownStartSchema = z.object({
  type: z.literal('countdown:start'),
  durationSeconds: z.number().min(1).max(10).default(3),
});

export const ClientBreakStartSchema = z.object({
  type: z.literal('break:start'),
  durationMinutes: z.number().min(1).max(60),
});

export const ClientBreakEndSchema = z.object({
  type: z.literal('break:end'),
});

export const ClientChatSchema = z.object({
  type: z.literal('chat'),
  text: z.string().min(1).max(500),
});

export const ClientReactSchema = z.object({
  type: z.literal('react'),
  emoji: z.string().min(1).max(10),
});

export const ClientHandSchema = z.object({
  type: z.literal('hand'),
  raised: z.boolean(),
});

export const ClientMediaToggleSchema = z.object({
  type: z.literal('media:toggle'),
  isMuted: z.boolean().optional(),
  cameraOn: z.boolean().optional(),
});

export const ClientPingSchema = z.object({
  type: z.literal('ping'),
  clientTs: z.number(),
});

export const ClientRtcSignalSchema = z.object({
  type: z.literal('rtc:signal'),
  targetPeerId: z.string(),
  signal: z.unknown(),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
  ClientJoinSchema,
  ClientLeaveSchema,
  ClientReadySchema,
  ClientSourceSetSchema,
  ClientPlaySchema,
  ClientPauseSchema,
  ClientSeekSchema,
  ClientCountdownStartSchema,
  ClientBreakStartSchema,
  ClientBreakEndSchema,
  ClientChatSchema,
  ClientReactSchema,
  ClientHandSchema,
  ClientMediaToggleSchema,
  ClientPingSchema,
  ClientRtcSignalSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server -> Client Events
export type ServerMessage =
  | { type: 'room:init'; state: z.infer<typeof RoomStateSchema>; yourId: string }
  | { type: 'room:sync'; state: z.infer<typeof RoomStateSchema> }
  | { type: 'presence'; participants: z.infer<typeof ParticipantSchema>[] }
  | { type: 'player:sync'; player: z.infer<typeof PlayerStateSchema> }
  | { type: 'source:sync'; source: z.infer<typeof MediaSourceStateSchema> }
  | { type: 'countdown:started'; countdown: z.infer<typeof CountdownStateSchema> }
  | { type: 'break:sync'; breakState: z.infer<typeof BreakStateSchema> | null }
  | { type: 'chat'; message: z.infer<typeof ChatMessageSchema> }
  | { type: 'react'; reaction: { id: string; senderId: string; emoji: string; timestamp: number } }
  | { type: 'pong'; clientTs: number; serverTs: number }
  | { type: 'rtc:signal'; fromPeerId: string; signal: unknown }
  | { type: 'error'; message: string; code?: string };
