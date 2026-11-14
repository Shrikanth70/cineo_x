/**
 * WebRTC Mesh Manager (up to 8 peers)
 * Handles local media stream (camera/mic opt-in), peer connections, STUN/TURN ICE config,
 * host media broadcasting (screen share & local video streaming), and mesh signaling events.
 */

export interface IceConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface BroadcastSignalInfo {
  active: boolean;
  streamId?: string;
  videoTrackId?: string;
  audioTrackId?: string;
}

export class WebRtcMeshManager {
  private localStream: MediaStream | null = null;
  private broadcastStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private onRemoteStreamCallback: ((peerId: string, stream: MediaStream) => void) | null = null;
  private onRemoteLeaveCallback: ((peerId: string) => void) | null = null;
  private onRemoteBroadcastStreamCallback: ((stream: MediaStream | null) => void) | null = null;
  private sendSignalCallback: ((targetPeerId: string, signal: unknown) => void) | null = null;
  private remoteBroadcastStream: MediaStream | null = null;
  private remoteBroadcastInfo: BroadcastSignalInfo | null = null;

  constructor(
    sendSignal: (targetPeerId: string, signal: unknown) => void,
    onRemoteStream?: (peerId: string, stream: MediaStream) => void,
    onRemoteLeave?: (peerId: string) => void,
    onRemoteBroadcastStream?: (stream: MediaStream | null) => void
  ) {
    this.sendSignalCallback = sendSignal;
    this.onRemoteStreamCallback = onRemoteStream || null;
    this.onRemoteLeaveCallback = onRemoteLeave || null;
    this.onRemoteBroadcastStreamCallback = onRemoteBroadcastStream || null;
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

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getBroadcastStream(): MediaStream | null {
    return this.broadcastStream;
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

      // Update existing peer connections with new tracks via sender.replaceTrack
      for (const [, pc] of this.peerConnections) {
        this.attachLocalStreamToPc(pc);
      }

      return this.localStream;
    } catch {
      // Permission denied or mock environment
      return null;
    }
  }

  private attachLocalStreamToPc(pc: RTCPeerConnection): void {
    if (!this.localStream) return;
    const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
    const aSender = transceivers[0]?.sender;
    const vSender = transceivers[1]?.sender;

    const aTrack = this.localStream.getAudioTracks()[0] || null;
    const vTrack = this.localStream.getVideoTracks()[0] || null;

    if (aSender && aSender.replaceTrack) {
      aSender.replaceTrack(aTrack).catch(() => {});
    }
    if (vSender && vSender.replaceTrack) {
      vSender.replaceTrack(vTrack).catch(() => {});
    }
  }

  private attachBroadcastStreamToPc(pc: RTCPeerConnection): void {
    const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
    const bAudioSender = transceivers[2]?.sender;
    const bVideoSender = transceivers[3]?.sender;

    const aTrack = this.broadcastStream?.getAudioTracks()[0] || null;
    const vTrack = this.broadcastStream?.getVideoTracks()[0] || null;

    if (bAudioSender && bAudioSender.replaceTrack) {
      bAudioSender.replaceTrack(aTrack).catch(() => {});
    }
    if (bVideoSender && bVideoSender.replaceTrack) {
      bVideoSender.replaceTrack(vTrack).catch(() => {});
    }
  }

  /**
   * Set or update host broadcast stream (e.g. screen share or local video stream)
   * Broadcasts to all connected peers in real-time.
   */
  public async setBroadcastStream(stream: MediaStream | null): Promise<void> {
    this.broadcastStream = stream;

    const audioTrack = stream?.getAudioTracks()[0] || null;
    const videoTrack = stream?.getVideoTracks()[0] || null;

    for (const [peerId, pc] of this.peerConnections) {
      this.attachBroadcastStreamToPc(pc);

      this.sendSignalCallback?.(peerId, {
        type: 'broadcast-info',
        active: Boolean(stream),
        streamId: stream?.id,
        videoTrackId: videoTrack?.id,
        audioTrackId: audioTrack?.id,
      });

      // Renegotiate offer so the receiver immediately maps the newly active media tracks
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignalCallback?.(peerId, { type: 'offer', sdp: offer.sdp });
      } catch {
        // Ignore initial renegotiation error
      }
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

  /**
   * Initiate a peer connection to a target participant
   */
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

  /**
   * Alias for initiateConnection to guarantee compatibility
   */
  public async call(targetPeerId: string): Promise<void> {
    return this.initiateConnection(targetPeerId);
  }

  public async handleSignal(fromPeerId: string, signal: any): Promise<void> {
    if (!signal) return;

    // Handle broadcast metadata signals
    if (signal.type === 'broadcast-info') {
      if (signal.active) {
        this.remoteBroadcastInfo = signal;
      } else {
        this.remoteBroadcastInfo = null;
        if (this.remoteBroadcastStream) {
          this.remoteBroadcastStream.getTracks().forEach((t) => t.stop());
          this.remoteBroadcastStream = null;
        }
        this.onRemoteBroadcastStreamCallback?.(null);
      }
      return;
    }

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

    // 4 Transceivers for deterministic media routing:
    // 0: User Audio (mic)
    // 1: User Video (camera)
    // 2: Broadcast Audio (host screen or video file sound)
    // 3: Broadcast Video (host screen or video file video)
    try {
      if (pc.addTransceiver) {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        pc.addTransceiver('video', { direction: 'sendrecv' });
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        pc.addTransceiver('video', { direction: 'sendrecv' });
      }
    } catch {
      // Ignore if transceivers are already configured
    }

    if (this.localStream) {
      this.attachLocalStreamToPc(pc);
    }

    if (this.broadcastStream) {
      this.attachBroadcastStreamToPc(pc);
      // Inform the peer about active broadcast
      const aTrack = this.broadcastStream.getAudioTracks()[0];
      const vTrack = this.broadcastStream.getVideoTracks()[0];
      this.sendSignalCallback?.(peerId, {
        type: 'broadcast-info',
        active: true,
        streamId: this.broadcastStream.id,
        videoTrackId: vTrack?.id,
        audioTrackId: aTrack?.id,
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalCallback?.(peerId, { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
      const isBroadcastTransceiver =
        Boolean(event.transceiver) &&
        (event.transceiver === transceivers[2] || event.transceiver === transceivers[3]);

      const isBroadcastSignalMatch =
        Boolean(this.remoteBroadcastInfo?.active) &&
        (event.track.id === this.remoteBroadcastInfo?.videoTrackId ||
          event.track.id === this.remoteBroadcastInfo?.audioTrackId ||
          event.streams[0]?.id === this.remoteBroadcastInfo?.streamId);

      const isBroadcastHint =
        event.track.label?.toLowerCase().includes('screen') ||
        event.streams[0]?.id?.includes('screen') ||
        event.streams[0]?.id?.includes('broadcast');

      if (isBroadcastTransceiver || isBroadcastSignalMatch || isBroadcastHint) {
        if (!this.remoteBroadcastStream) {
          this.remoteBroadcastStream = new MediaStream();
        }
        if (!this.remoteBroadcastStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteBroadcastStream.addTrack(event.track);
        }
        this.onRemoteBroadcastStreamCallback?.(this.remoteBroadcastStream);

        event.track.onended = () => {
          if (this.remoteBroadcastStream) {
            this.remoteBroadcastStream.removeTrack(event.track);
            if (this.remoteBroadcastStream.getTracks().length === 0) {
              this.remoteBroadcastStream = null;
              this.onRemoteBroadcastStreamCallback?.(null);
            }
          }
        };
      } else {
        const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
        this.onRemoteStreamCallback?.(peerId, stream);
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

    if (this.broadcastStream) {
      this.broadcastStream.getTracks().forEach((track) => track.stop());
      this.broadcastStream = null;
    }

    if (this.remoteBroadcastStream) {
      this.remoteBroadcastStream.getTracks().forEach((track) => track.stop());
      this.remoteBroadcastStream = null;
    }
  }
}
