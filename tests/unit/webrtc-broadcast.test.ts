import { describe, it, expect, vi } from 'vitest';
import { WebRtcMeshManager } from '@/lib/webrtc';

describe('WebRtcMeshManager broadcast streaming', () => {
  it('manages broadcast stream lifecycle and triggers broadcast-info signals', async () => {
    const sendSignal = vi.fn();
    const onRemoteStream = vi.fn();
    const onRemoteLeave = vi.fn();
    const onRemoteBroadcast = vi.fn();

    const manager = new WebRtcMeshManager(
      sendSignal,
      onRemoteStream,
      onRemoteLeave,
      onRemoteBroadcast
    );

    // Fake MediaStream
    const mockAudioTrack = { id: 'track-a-1', kind: 'audio', stop: vi.fn() } as any;
    const mockVideoTrack = { id: 'track-v-1', kind: 'video', stop: vi.fn() } as any;
    const mockStream = {
      id: 'stream-broadcast-1',
      getTracks: () => [mockAudioTrack, mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
    } as any;

    await manager.setBroadcastStream(mockStream);
    expect(manager.getBroadcastStream()).toBe(mockStream);

    // Stop broadcasting
    await manager.setBroadcastStream(null);
    expect(manager.getBroadcastStream()).toBeNull();

    manager.destroy();
  });

  it('handles remote broadcast-info signals properly', async () => {
    const sendSignal = vi.fn();
    const onRemoteBroadcast = vi.fn();

    const manager = new WebRtcMeshManager(
      sendSignal,
      vi.fn(),
      vi.fn(),
      onRemoteBroadcast
    );

    // When host starts broadcast
    await manager.handleSignal('host-1', {
      type: 'broadcast-info',
      active: true,
      streamId: 'stream-bcast',
      videoTrackId: 'v-track',
      audioTrackId: 'a-track',
    });

    // When host stops broadcast
    await manager.handleSignal('host-1', {
      type: 'broadcast-info',
      active: false,
    });

    expect(onRemoteBroadcast).toHaveBeenCalledWith(null);

    manager.destroy();
  });
});
