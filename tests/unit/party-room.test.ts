import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PartyRoom } from '../../src/components/watch-party/PartyRoom';
import * as HookModule from '../../src/hooks/useWatchParty';
import { RoomState } from '../../packages/shared/types';

vi.stubGlobal('navigator', {
  mediaDevices: { getUserMedia: vi.fn() },
  clipboard: { writeText: vi.fn() },
});

const mockRoom: RoomState = {
  code: 'CIN-TEST',
  title: 'Movie night',
  hostId: 'p-1',
  createdAt: Date.now(),
  participants: [
    {
      id: 'p-1',
      name: 'Shri',
      avatar: 'popcorn',
      isHost: true,
      isReady: false,
      movieModeMic: false,
      handRaised: false,
      isMuted: false,
      cameraOn: false,
      joinedAt: Date.now(),
    },
  ],
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

describe('PartyRoom component rendering with full room state', () => {
  it('renders full room layout without crashing', () => {
    vi.spyOn(HookModule, 'useWatchParty').mockReturnValue({
      status: 'connected',
      room: mockRoom,
      myId: 'p-1',
      currentParticipant: mockRoom.participants[0],
      isHost: true,
      messages: [],
      floatingReactions: [],
      errorNotice: null,
      ntp: {} as any,
      join: vi.fn(),
      leave: vi.fn(),
      toggleReady: vi.fn(),
      setSource: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      startCountdown: vi.fn(),
      startBreak: vi.fn(),
      endBreak: vi.fn(),
      sendChatMessage: vi.fn(),
      sendReaction: vi.fn(),
      toggleHandRaised: vi.fn(),
      toggleMedia: vi.fn(),
      sendRtcSignal: vi.fn(),
      reconnect: vi.fn(),
    });

    const html = renderToString(React.createElement(PartyRoom, { roomCode: 'CIN-TEST' }));
    expect(html).toContain('CIN-TEST');
    expect(html).toContain('Movie night');
    expect(html).toContain('Any OTT');
  });
});
