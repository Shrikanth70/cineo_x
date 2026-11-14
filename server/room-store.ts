import { RoomState, Participant, MediaSourceState, PlayerState, CountdownState, BreakState, ChatMessage, AvatarId } from '../packages/shared/types';

export class RoomStore {
  private rooms = new Map<string, RoomState>();
  private socketToRoom = new Map<string, { roomCode: string; participantId: string }>();

  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public getOrCreateRoom(code: string, title?: string): RoomState {
    const normalizedCode = code.toUpperCase();
    let room = this.rooms.get(normalizedCode);
    if (!room) {
      room = {
        code: normalizedCode,
        title: title || 'Movie night',
        hostId: '',
        createdAt: Date.now(),
        participants: [],
        source: {
          type: 'ott',
          title: 'Pick a film or show',
          ottPlatform: 'Any OTT',
        },
        player: {
          playing: false,
          position: 0,
          rate: 1,
          serverTs: Date.now(),
        },
        countdown: null,
        breakState: null,
      };
      this.rooms.set(normalizedCode, room);
    }
    return room;
  }

  public addParticipant(
    code: string,
    participant: {
      id: string;
      name: string;
      avatar: AvatarId;
      movieModeMic: boolean;
      roomTitle?: string;
    }
  ): { room: RoomState; participant: Participant; isNewHost: boolean } {
    const room = this.getOrCreateRoom(code, participant.roomTitle);
    if (participant.roomTitle && room.title === 'Movie night') {
      room.title = participant.roomTitle;
    }
    const existingIndex = room.participants.findIndex((p) => p.id === participant.id);

    let isHost = room.participants.length === 0 || room.hostId === participant.id;
    if (isHost) {
      room.hostId = participant.id;
    }

    const pRecord: Participant = {
      id: participant.id,
      name: participant.name,
      avatar: participant.avatar,
      isHost,
      isReady: false,
      movieModeMic: participant.movieModeMic,
      handRaised: false,
      isMuted: false,
      cameraOn: false,
      joinedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      room.participants[existingIndex] = {
        ...room.participants[existingIndex],
        ...pRecord,
        isHost: room.participants[existingIndex].isHost || isHost,
      };
    } else {
      room.participants.push(pRecord);
    }

    return { room, participant: pRecord, isNewHost: isHost };
  }

  public removeParticipant(code: string, participantId: string): { room: RoomState | null; newHostId: string | null } {
    const room = this.getRoom(code);
    if (!room) return { room: null, newHostId: null };

    const wasHost = room.hostId === participantId;
    room.participants = room.participants.filter((p) => p.id !== participantId);

    let newHostId: string | null = null;
    if (wasHost && room.participants.length > 0) {
      // Host handover to the oldest joined participant
      room.participants.sort((a, b) => a.joinedAt - b.joinedAt);
      room.participants[0].isHost = true;
      room.hostId = room.participants[0].id;
      newHostId = room.hostId;
    }

    if (room.participants.length === 0) {
      // Room empty - cleanup
      this.rooms.delete(code.toUpperCase());
      return { room: null, newHostId: null };
    }

    return { room, newHostId };
  }

  public updatePlayerState(code: string, player: Partial<PlayerState>): PlayerState | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.player = {
      ...room.player,
      ...player,
      serverTs: Date.now(),
    };
    return room.player;
  }

  public updateSource(code: string, source: MediaSourceState): MediaSourceState | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.source = source;
    // Reset player position on source change
    room.player = {
      playing: false,
      position: 0,
      rate: 1,
      serverTs: Date.now(),
    };
    // Reset readiness
    room.participants.forEach((p) => {
      p.isReady = false;
    });
    return room.source;
  }

  public setParticipantReady(code: string, participantId: string, ready: boolean): Participant[] | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const p = room.participants.find((item) => item.id === participantId);
    if (p) {
      p.isReady = ready;
    }
    return room.participants;
  }

  public setHandRaised(code: string, participantId: string, raised: boolean): Participant[] | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const p = room.participants.find((item) => item.id === participantId);
    if (p) {
      p.handRaised = raised;
    }
    return room.participants;
  }

  public setMediaToggle(
    code: string,
    participantId: string,
    opts: { isMuted?: boolean; cameraOn?: boolean }
  ): Participant[] | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const p = room.participants.find((item) => item.id === participantId);
    if (p) {
      if (typeof opts.isMuted === 'boolean') p.isMuted = opts.isMuted;
      if (typeof opts.cameraOn === 'boolean') p.cameraOn = opts.cameraOn;
    }
    return room.participants;
  }

  public startCountdown(code: string, durationSeconds: number): CountdownState | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const targetTs = Date.now() + durationSeconds * 1000;
    room.countdown = {
      active: true,
      targetTs,
      durationSeconds,
    };
    return room.countdown;
  }

  public startBreak(code: string, durationMinutes: number): BreakState | null {
    const room = this.getRoom(code);
    if (!room) return null;

    // Pause player
    room.player.playing = false;
    room.player.serverTs = Date.now();

    const endsAtTs = Date.now() + durationMinutes * 60 * 1000;
    room.breakState = {
      active: true,
      durationMinutes,
      endsAtTs,
    };
    return room.breakState;
  }

  public endBreak(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;

    room.breakState = null;
    return true;
  }
}

export const roomStore = new RoomStore();
