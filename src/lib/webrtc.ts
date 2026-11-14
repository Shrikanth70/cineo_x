/**
 * WebRTC Mesh Manager (up to 8 peers)
 * Handles local media stream (camera/mic opt-in), peer connections, STUN/TURN ICE config,
 * and mesh signaling events.
 */

export interface IceConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export class WebRtcMeshManager {
  private localStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private onRemoteStreamCallback: ((peerId: string, stream: MediaStream) => void) | null = null;
  private onRemoteLeaveCallback: ((peerId: string) => void) | null = null;
  private sendSignalCallback: ((targetPeerId: string, signal: unknown) => void) | null = null;

  constructor(
    sendSignal: (targetPeerId: string, signal: unknown) => void,
    onRemoteStream?: (peerId: string, stream: MediaStream) => void,
    onRemoteLeave?: (peerId: string) => void
  ) {
    this.sendSignalCallback = sendSignal;
    this.onRemoteStreamCallback = onRemoteStream || null;
    this.onRemoteLeaveCallback = onRemoteLeave || null;
  }

  private getRtcConfig(): RTCConfiguration {
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];

    const turnServer = process.env.NEXT_PUBLIC_TURN_SERVER;
    if (turnServer) {
      iceServers.push({
        urls: turnServer,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      });
    }

    return { iceServers };
  }

  public async acquireLocalMedia(audio = true, video = false): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return null;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } } : false,
      });

      // Update existing peer connections with new tracks
      for (const [, pc] of this.peerConnections) {
        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch {
      // Permission denied or mock environment
      return null;
    }
  }

  public toggleMute(muted: boolean): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  public toggleCamera(enabled: boolean): void {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  public async initiateConnection(targetPeerId: string): Promise<void> {
    if (this.peerConnections.has(targetPeerId)) return;

    const pc = this.createPeerConnection(targetPeerId);
    this.peerConnections.set(targetPeerId, pc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignalCallback?.(targetPeerId, { type: 'offer', sdp: offer.sdp });
    } catch {
      // Ignore initial negotiation error
    }
  }

  public async handleSignal(fromPeerId: string, signal: any): Promise<void> {
    if (!signal) return;

    let pc = this.peerConnections.get(fromPeerId);
    if (!pc) {
      pc = this.createPeerConnection(fromPeerId);
      this.peerConnections.set(fromPeerId, pc);
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignalCallback?.(fromPeerId, { type: 'answer', sdp: answer.sdp });
      } else if (signal.type === 'answer') {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch {
      // Ignore signaling errors in volatile network states
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.getRtcConfig());

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalCallback?.(peerId, { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStreamCallback?.(peerId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    return pc;
  }

  public closePeer(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
      this.onRemoteLeaveCallback?.(peerId);
    }
  }

  public destroy(): void {
    for (const [, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}

