'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWatchParty } from '@/hooks/useWatchParty';
import { MediaSourceType, MediaSourceState } from '@shared/types';
import { OttSource } from './sources/OttSource';
import { YouTubeSource } from './sources/YouTubeSource';
import { VideoFileSource } from './sources/VideoFileSource';
import { ScreenShareSource } from './sources/ScreenShareSource';
import { PlayerBar } from './PlayerBar';
import { EmojiReactions } from './EmojiReactions';
import { ParticipantStrip } from './ParticipantStrip';
import { ChatPanel } from './ChatPanel';
import { CountdownOverlay } from './CountdownOverlay';
import { BreakOverlay } from './BreakOverlay';
import { WebRtcMeshManager } from '@/lib/webrtc';
import {
  Share2,
  Check,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize,
  Minimize,
  Lock,
  ChevronLeft,
  Settings,
} from 'lucide-react';

export interface PartyRoomProps {
  roomCode: string;
}

// Background dedicated audio channel for remote voice communication
function RemoteVoiceAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

export function PartyRoom({ roomCode }: PartyRoomProps) {
  const rtcManagerRef = useRef<WebRtcMeshManager | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile vs desktop view to ensure ONLY ONE player instance is mounted
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // WebRTC Signal dispatcher
  const handleRtcSignal = (fromPeerId: string, signal: unknown) => {
    rtcManagerRef.current?.handleSignal(fromPeerId, signal);
  };

  const {
    status,
    room,
    myId,
    currentParticipant,
    isHost,
    messages,
    floatingReactions,
    errorNotice,
    ntp,
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
    toggleMedia,
    sendRtcSignal,
    reconnect,
  } = useWatchParty({ roomCode, onRtcSignal: handleRtcSignal });

  const [activeTab, setActiveTab] = useState<MediaSourceType>('ott');
  const [copiedLink, setCopiedLink] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [localCameraOn, setLocalCameraOn] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'party' | 'controls'>('chat');
  const [remoteBroadcastStream, setRemoteBroadcastStream] = useState<MediaStream | null>(null);

  // Initialize WebRTC Mesh Manager for camera, microphone, and broadcast media
  useEffect(() => {
    if (!myId) return;

    const manager = new WebRtcMeshManager(
      (targetPeerId, signal) => {
        sendRtcSignal(targetPeerId, signal);
      },
      (peerId, stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(peerId, stream);
          return next;
        });
      },
      (peerId) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      },
      (stream) => {
        setRemoteBroadcastStream(stream);
      }
    );
    rtcManagerRef.current = manager;

    return () => {
      manager.destroy();
      rtcManagerRef.current = null;
    };
  }, [myId, sendRtcSignal]);

  // Connect to room participants via WebRTC mesh
  useEffect(() => {
    if (!room || !myId || !rtcManagerRef.current) return;
    room.participants.forEach((p) => {
      if (p.id !== myId) {
        rtcManagerRef.current?.call(p.id);
      }
    });
  }, [room, myId]);

  // Sync active tab with room's current media source type
  useEffect(() => {
    if (room?.source?.type) {
      setActiveTab(room.source.type);
    }
  }, [room?.source?.type]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const handleShareInvite = async () => {
    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/watch-party#join=${roomCode}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my Cinéo Watch Party: ${room?.title || 'Movie night'}`,
          text: `Watch together in sync! Join code: ${roomCode}`,
          url: inviteUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleTabChange = (tab: MediaSourceType) => {
    if (!isHost) return;
    setActiveTab(tab);
    if (room) {
      setSource({
        type: tab,
        title: tab === 'ott' ? 'Pick a film or show' : `${tab.toUpperCase()} Stream`,
      });
    }
  };

  const toggleMic = async () => {
    const next = !localMuted;
    setLocalMuted(next);
    if (!next && !localStream && rtcManagerRef.current) {
      const s = await rtcManagerRef.current.acquireLocalMedia(true, localCameraOn);
      if (s) setLocalStream(s);
    }
    rtcManagerRef.current?.toggleMute(next);
    toggleMedia({ isMuted: next });
  };

  const toggleCamera = async () => {
    const next = !localCameraOn;
    setLocalCameraOn(next);
    if (next && rtcManagerRef.current) {
      const s = await rtcManagerRef.current.acquireLocalMedia(!localMuted, true);
      if (s) setLocalStream(s);
    }
    rtcManagerRef.current?.toggleCamera(next);
    toggleMedia({ cameraOn: next });
  };

  const handleStartBroadcast = (stream: MediaStream) => {
    rtcManagerRef.current?.setBroadcastStream(stream);
  };

  const handleStopBroadcast = () => {
    rtcManagerRef.current?.setBroadcastStream(null);
  };

  useEffect(() => {
    if (activeTab !== 'screen' && activeTab !== 'file') {
      rtcManagerRef.current?.setBroadcastStream(null);
    }
  }, [activeTab]);

  const toggleContainerFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      const el = playerContainerRef.current as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  if (!room) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-accent border-t-transparent mb-4 shadow-glow" />
        <h2 className="font-serif text-xl font-bold text-white">Connecting to Cinéo Room...</h2>
        <p className="mt-1 text-xs text-zinc-400">Synchronizing with host and room presence.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-surface-card p-4 text-left text-xs text-zinc-300 space-y-2.5 w-full">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-2">
            <span>Status:</span>
            <span className="font-semibold text-amber-accent uppercase tracking-wider">{status}</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            • <strong>Live Synchronization:</strong> Synchronizing high-precision clock &amp; WebRTC mesh.
          </p>
        </div>

        <button
          onClick={() => reconnect()}
          className="mt-4 rounded-full border border-amber-border bg-amber-dim px-5 py-2 text-xs font-semibold text-amber-accent hover:bg-amber-accent hover:text-background transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Rejoin &amp; Resync</span>
        </button>
      </div>
    );
  }

  const participantCount = room.participants.length;
  const statusHeadline = participantCount <= 1 ? 'Waiting for friends · share invite' : `${participantCount} friends watching`;

  const sourceLabels: Record<MediaSourceType, string> = {
    ott: 'Any OTT',
    youtube: 'YouTube',
    file: 'Video file',
    screen: 'Screen share',
  };

  // Singular Player Content Component: Mounted only once in the DOM
  const renderPlayerContent = () => (
    <>
      {activeTab === 'ott' && (
        <OttSource
          source={room.source}
          isHost={isHost}
          onUpdateSource={setSource}
        />
      )}
      {activeTab === 'youtube' && (
        <YouTubeSource
          source={room.source}
          player={room.player}
          isHost={isHost}
          onUpdateSource={setSource}
          onPlayerSeek={seek}
          onPlayerPlay={play}
          onPlayerPause={pause}
        />
      )}
      {activeTab === 'file' && (
        <VideoFileSource
          source={room.source}
          player={room.player}
          isHost={isHost}
          onUpdateSource={setSource}
          broadcastStream={remoteBroadcastStream}
          onStartBroadcast={handleStartBroadcast}
          onStopBroadcast={handleStopBroadcast}
        />
      )}
      {activeTab === 'screen' && (
        <ScreenShareSource
          source={room.source}
          isHost={isHost}
          onUpdateSource={setSource}
          broadcastStream={remoteBroadcastStream}
          onStartBroadcast={handleStartBroadcast}
          onStopBroadcast={handleStopBroadcast}
        />
      )}

      {/* Overlays: Floating Reactions, Countdown, Break */}
      <EmojiReactions reactions={floatingReactions} />
      <CountdownOverlay countdown={room.countdown} ntp={ntp} />
      <BreakOverlay
        breakState={room.breakState}
        ntp={ntp}
        isHost={isHost}
        onEndBreak={endBreak}
      />

      {/* Fullscreen Button */}
      <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleContainerFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/70 border border-white/20 text-white backdrop-blur-md hover:bg-black/90 transition-all"
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden select-none">
      {/* Global Dedicated Remote Audio Playback (Voice Chat) */}
      <div className="hidden" aria-hidden="true">
        {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <RemoteVoiceAudio key={peerId} stream={stream} />
        ))}
      </div>

      {/* ========================================================= */}
      {/* Top Header Bar (Unified for Both Desktop & Mobile)        */}
      {/* ========================================================= */}
      <header className="flex h-12 items-center justify-between border-b border-border-hairline bg-surface/95 px-3 sm:px-6 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <Link
            href="/watch-party"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-surface text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Leave party & return to Watch Party lobby"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1">
                {room.title}
              </h1>
              <span className="hidden sm:inline-block rounded bg-surface-elevated border border-border-hairline px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                {room.code}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden xs:block">{statusHeadline}</p>
          </div>
        </div>

        {/* Center: Desktop Host Source Tabs or Viewer Lock Badge */}
        <div className="hidden lg:flex items-center justify-center">
          {isHost ? (
            <div className="flex items-center gap-1 rounded-full border border-border-hairline bg-surface-card p-0.5 shadow-inner">
              {(['ott', 'youtube', 'file', 'screen'] as MediaSourceType[]).map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-amber-accent text-background font-semibold shadow-glow'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {sourceLabels[tab]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-card/90 px-3 py-1 text-[11px] text-zinc-300 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">{sourceLabels[room.source.type]}</span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-amber-accent/80" /> Synced with Host
              </span>
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Connection status with One-Click Rejoin / Resync */}
          <div className="flex items-center">
            {status === 'connected' ? (
              <button
                type="button"
                onClick={() => reconnect()}
                title="Synchronized with host. Tap to force resync."
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Synced</span>
                <RefreshCw className="h-3 w-3 text-emerald-400/80" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => reconnect()}
                className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors animate-pulse"
              >
                <RefreshCw className="h-3 w-3 animate-spin text-rose-300" />
                <span>Rejoin</span>
              </button>
            )}
          </div>

          {/* Quick Mic & Camera Toggles */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-1.5 rounded-full border text-xs transition-colors ${
                localMuted
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
              title={localMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {localMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className={`p-1.5 rounded-full border text-xs transition-colors ${
                !localCameraOn
                  ? 'border-white/10 bg-white/5 text-zinc-400'
                  : 'border-amber-border bg-amber-dim text-amber-accent'
              }`}
              title={localCameraOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {localCameraOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Copy / Share Invite Button */}
          <button
            type="button"
            onClick={handleShareInvite}
            className="flex items-center gap-1.5 rounded-full bg-amber-dim border border-amber-border px-3 py-1 text-xs font-semibold text-amber-accent hover:bg-amber-accent hover:text-background transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>
        </div>
      </header>

      {errorNotice && (
        <div className="flex items-center gap-2 bg-rose-500/10 border-b border-rose-500/20 px-4 py-1 text-xs text-rose-300 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Main Party Room Body */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden flex-col md:flex-row">
        {/* ========================================================= */}
        {/* DESKTOP VIEW (md+): Theater Left Stage, Docked Right Chat */}
        {/* ========================================================= */}
        <div className="hidden md:flex flex-1 min-w-0 flex-col justify-between overflow-y-auto p-4 lg:p-5">
          {/* Tablet host tabs if < lg */}
          {isHost && (
            <div className="flex lg:hidden items-center justify-center pb-2">
              <div className="flex items-center gap-1 rounded-full border border-border-hairline bg-surface-card p-1 shadow-inner">
                {(['ott', 'youtube', 'file', 'screen'] as MediaSourceType[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-amber-accent text-background font-semibold shadow-glow'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {sourceLabels[tab]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grand 16:9 Cinema Player Stage (Rendered ONLY on Desktop) */}
          {!isMobile && (
            <div
              ref={playerContainerRef}
              className="relative w-full aspect-video max-h-[calc(100dvh-200px)] rounded-2xl border border-white/10 bg-black overflow-hidden flex items-center justify-center shadow-2xl mx-auto my-auto"
            >
              {renderPlayerContent()}
            </div>
          )}

          {/* Bottom Controls: Unified Player Bar & Sleek Participant Dock */}
          <div className="mt-3 space-y-2.5 shrink-0">
            <PlayerBar
              player={room.player}
              participants={room.participants}
              isHost={isHost}
              isReady={Boolean(currentParticipant?.isReady)}
              onPlay={play}
              onPause={pause}
              onSeek={seek}
              onToggleReady={() => toggleReady(Boolean(currentParticipant?.isReady))}
              onStartBreak={startBreak}
              onStartCountdown={startCountdown}
            />

            <ParticipantStrip
              participants={room.participants}
              myId={myId}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              localMuted={localMuted}
              localCameraOn={localCameraOn}
              localStream={localStream}
              remoteStreams={remoteStreams}
            />
          </div>
        </div>

        {/* Desktop Docked Live Chat Sidebar (Always Visible on Right) */}
        <div className="hidden md:flex w-80 lg:w-96 shrink-0 h-full border-l border-white/10 bg-surface-card overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={sendChatMessage}
            onSendReaction={sendReaction}
            isOpen={true}
          />
        </div>

        {/* ========================================================= */}
        {/* MOBILE VIEW (< md): JioHotstar-Style Live Stream Layout   */}
        {/* ========================================================= */}
        <div className="flex md:hidden flex-col flex-1 min-h-0 w-full overflow-hidden">
          {/* 1. Pinned 16:9 Video Player (Rendered ONLY on Mobile) */}
          {isMobile && (
            <div
              ref={playerContainerRef}
              className="relative w-full aspect-video bg-black shrink-0 overflow-hidden border-b border-border-hairline shadow-md"
            >
              {renderPlayerContent()}
            </div>
          )}

          {/* 2. JioHotstar Segmented Tabs Directly Underneath Video */}
          <div className="flex items-center justify-between border-b border-border-hairline bg-surface-elevated/95 px-2.5 py-1 shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMobileTab('chat')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  mobileTab === 'chat'
                    ? 'bg-amber-accent text-background shadow-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Live Chat</span>
                <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                  {messages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('party')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  mobileTab === 'party'
                    ? 'bg-amber-accent text-background shadow-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Friends</span>
                <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                  {room.participants.length}
                </span>
              </button>

              {isHost && (
                <button
                  type="button"
                  onClick={() => setMobileTab('controls')}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                    mobileTab === 'controls'
                      ? 'bg-amber-accent text-background shadow-glow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Controls</span>
                </button>
              )}
            </div>

            {/* Quick sync badge */}
            <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1 pr-1">
              {isHost ? (
                <span className="text-amber-accent font-semibold">Host</span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" /> Synced
                </span>
              )}
            </span>
          </div>

          {/* 3. Full Height Tab Content Area */}
          <div className="flex flex-1 min-h-0 w-full overflow-hidden">
            {mobileTab === 'chat' ? (
              <ChatPanel
                isMobileEmbedded={true}
                messages={messages}
                onSendMessage={sendChatMessage}
                onSendReaction={sendReaction}
                isOpen={true}
              />
            ) : mobileTab === 'party' ? (
              <div className="flex flex-1 flex-col overflow-y-auto p-3 space-y-3">
                <div className="rounded-xl border border-border-hairline bg-surface-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span>Party Voice &amp; Video</span>
                    <span className="text-[11px] text-zinc-400 font-normal">{room.participants.length} connected</span>
                  </div>
                  <ParticipantStrip
                    participants={room.participants}
                    myId={myId}
                    onToggleMic={toggleMic}
                    onToggleCamera={toggleCamera}
                    localMuted={localMuted}
                    localCameraOn={localCameraOn}
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                  />
                </div>

                {/* PlayerBar info on mobile */}
                <PlayerBar
                  player={room.player}
                  participants={room.participants}
                  isHost={isHost}
                  isReady={Boolean(currentParticipant?.isReady)}
                  onPlay={play}
                  onPause={pause}
                  onSeek={seek}
                  onToggleReady={() => toggleReady(Boolean(currentParticipant?.isReady))}
                  onStartBreak={startBreak}
                  onStartCountdown={startCountdown}
                />
              </div>
            ) : (
              /* Host Controls Tab */
              <div className="flex flex-1 flex-col overflow-y-auto p-3 space-y-3">
                <div className="rounded-xl border border-border-hairline bg-surface-card p-3 space-y-2">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Change Stream Source
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['ott', 'youtube', 'file', 'screen'] as MediaSourceType[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabChange(tab)}
                        className={`rounded-xl py-2 text-xs font-medium transition-all ${
                          activeTab === tab
                            ? 'bg-amber-accent text-background font-semibold shadow-glow'
                            : 'bg-surface border border-border-hairline text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sourceLabels[tab]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border-hairline bg-surface-card p-3 space-y-2">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Playback &amp; Break
                  </span>
                  <PlayerBar
                    player={room.player}
                    participants={room.participants}
                    isHost={isHost}
                    isReady={Boolean(currentParticipant?.isReady)}
                    onPlay={play}
                    onPause={pause}
                    onSeek={seek}
                    onToggleReady={() => toggleReady(Boolean(currentParticipant?.isReady))}
                    onStartBreak={startBreak}
                    onStartCountdown={startCountdown}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
