export type AvatarId =
  | 'popcorn'
  | 'clapper'
  | 'unicorn'
  | 'panda'
  | 'fox'
  | 'alien'
  | 'robot'
  | 'frog'
  | 'ghost'
  | 'lion'
  | 'octopus'
  | 'chili';

export interface AvatarMeta {
  id: AvatarId;
  label: string;
  emoji: string;
}

export const AVATARS: Record<AvatarId, AvatarMeta> = {
  popcorn: { id: 'popcorn', label: 'Popcorn', emoji: '🍿' },
  clapper: { id: 'clapper', label: 'Clapper', emoji: '🎬' },
  unicorn: { id: 'unicorn', label: 'Unicorn', emoji: '🦄' },
  panda: { id: 'panda', label: 'Panda', emoji: '🐼' },
  fox: { id: 'fox', label: 'Fox', emoji: '🦊' },
  alien: { id: 'alien', label: 'Alien', emoji: '👽' },
  robot: { id: 'robot', label: 'Robot', emoji: '🤖' },
  frog: { id: 'frog', label: 'Frog', emoji: '🐸' },
  ghost: { id: 'ghost', label: 'Ghost', emoji: '👻' },
  lion: { id: 'lion', label: 'Lion', emoji: '🦁' },
  octopus: { id: 'octopus', label: 'Octopus', emoji: '🐙' },
  chili: { id: 'chili', label: 'Chili', emoji: '🌶️' },
};

export type MediaSourceType = 'ott' | 'youtube' | 'file' | 'screen';

export interface FileFingerprint {
  name: string;
  size: number;
  duration?: number;
}

export interface MediaSourceState {
  type: MediaSourceType;
  url?: string;
  title?: string;
  ottPlatform?: string;
  fileFingerprint?: FileFingerprint;
}

export interface PlayerState {
  playing: boolean;
  position: number;
  rate: number;
  serverTs: number;
}

export interface CountdownState {
  active: boolean;
  targetTs: number;
  durationSeconds: number;
}

export interface BreakState {
  active: boolean;
  durationMinutes: number;
  endsAtTs: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: AvatarId;
  isHost: boolean;
  isReady: boolean;
  movieModeMic: boolean;
  handRaised: boolean;
  isMuted: boolean;
  cameraOn: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: AvatarId;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  senderId: string;
  emoji: string;
  timestamp: number;
}

export interface RoomState {
  code: string;
  title: string;
  hostId: string;
  createdAt: number;
  participants: Participant[];
  source: MediaSourceState;
  player: PlayerState;
  countdown: CountdownState | null;
  breakState: BreakState | null;
}

