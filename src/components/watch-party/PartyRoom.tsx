'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWatchParty } from '@/hooks/useWatchParty';
import { MediaSourceType, MediaSourceState } from '@shared/types';
import { OttSource } from './sources/OttSource';
import { YouTubeSource } from './sources/YouTubeSource';
import { VideoFileSource } from './sources/VideoFileSource';
import { ScreenShareSource } from './sources/ScreenShareSource';
import { PlayerBar } from './PlayerBar';
import { ControlDock } from './ControlDock';
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
  Wifi,
  RefreshCw,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize,
  Minimize,
  Lock,
} from 'lucide-react';

export interface PartyRoomProps {
  roomCode: string;
}

export function PartyRoom({ roomCode }: PartyRoomProps) {
  const rtcManagerRef = useRef<WebRtcMeshManager | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenChatOpen, setFullscreenChatOpen] = useState(false);

  const handleRtcSignal = React.useCallback((fromPeerId: string, signal: unknown) => {
    rtcManagerRef.current?.handleSignal(fromPeerId, signal);
  }, []);

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
    toggleHandRaised,
    toggleMedia,
    sendRtcSignal,
    reconnect,
  } = useWatchParty({ roomCode, onRtcSignal: handleRtcSignal });

  const [activeTab, setActiveTab] = useState<MediaSourceType>('ott');
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [localCameraOn, setLocalCameraOn] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'party'>('chat');

  // Initialize WebRTC Mesh Manager for camera and microphone exchange
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

  // Handle Space key for push-to-talk when movie-mode mic is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' && currentParticipant?.movieModeMic) {
        setLocalMuted(false);
        rtcManagerRef.current?.toggleMute(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' && currentParticipant?.movieModeMic) {
        setLocalMuted(true);
        rtcManagerRef.current?.toggleMute(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentParticipant?.movieModeMic]);

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
    if (!isHost) return; // Viewers are locked to host's source to prevent sync breakage
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-accent border-t-transparent mb-4" />
        <h2 className="font-serif text-xl font-bold text-white">Connecting to Cinéo Room...</h2>
        <p className="mt-1 text-xs text-zinc-400">Synchronizing with host and room presence.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-surface-card p-4 text-left text-xs text-zinc-300 space-y-2.5 w-full">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-2">
            <span>Status:</span>
            <span className="font-semibold text-amber-accent uppercase tracking-wider">{status}</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            • <strong>Live Synchronization:</strong> Establishing real-time NTP clock and WebRTC peer mesh.
          </p>
        </div>

        <button
          onClick={() => reconnect()}
          className="mt-4 rounded-full border border-amber-border bg-amber-dim px-5 py-2 text-xs font-semibold text-amber-accent hover:bg-amber-accent hover:text-background transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Rejoin & Resync</span>
        </button>
      </div>
    );
  }

  const participantCount = room.participants.length;
  const statusHeadline = participantCount <= 1 ? 'Waiting for friends · share the invite' : `${participantCount} friends watching`;

  const sourceLabels: Record<MediaSourceType, string> = {
    ott: 'Any OTT',
    youtube: 'YouTube',
    file: 'Video file',
    screen: 'Screen share',
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] w-full bg-background overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-border-hairline bg-surface/90 px-3 py-2 sm:px-6 sm:py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
                {room.title}
              </h1>
              <span className="hidden sm:inline-block rounded bg-surface-elevated border border-border-hairline px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
                {room.code}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden xs:block">{statusHeadline}</p>
          </div>
        </div>

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
                className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors animate-pulse"
              >
                <RefreshCw className="h-3 w-3 animate-spin text-rose-300" />
                <span>Rejoin</span>
              </button>
            )}
          </div>

          {/* Quick Mic & Camera Toggles in header for instant access */}
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
        <div className="flex items-center gap-2 bg-rose-500/10 border-b border-rose-500/20 px-4 py-1.5 text-xs text-rose-300 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Main Party Room Body */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* ========================================================= */}
        {/* DESKTOP VIEW (md+): Dual-pane (Left Player, Right Chat)  */}
        {/* ========================================================= */}
        <div className="hidden md:flex flex-1 flex-col justify-between overflow-y-auto p-4 lg:p-5">
          {/* Host Tabs or Viewer Sync Status Badge */}
          {isHost ? (
            <div className="flex items-center justify-center pb-3">
              <div className="flex items-center gap-1 rounded-full border border-border-hairline bg-surface-card p-1 shadow-inner">
                {(['ott', 'youtube', 'file', 'screen'] as MediaSourceType[]).map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTabChange(tab)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
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
            </div>
          ) : (
            <div className="flex items-center justify-center pb-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-card/90 px-3.5 py-1.5 text-xs text-zinc-300 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">{sourceLabels[room.source.type]}</span>
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-amber-accent/80" /> Synchronized with Host
                </span>
              </div>
            </div>
          )}

          {/* Desktop Media Player Viewport Container */}
          <div
            ref={playerContainerRef}
            className="relative flex-1 min-h-[360px] rounded-2xl border border-border-hairline bg-black overflow-hidden flex flex-col justify-center shadow-2xl"
          >
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
              />
            )}
            {activeTab === 'screen' && (
              <ScreenShareSource
                source={room.source}
                isHost={isHost}
                onUpdateSource={setSource}
              />
            )}

            {/* Overlays: Floating Reactions, Countdown, Break */}
            <EmojiReactions
              reactions={floatingReactions}
              onSendReaction={sendReaction}
            />
            <CountdownOverlay countdown={room.countdown} ntp={ntp} />
            <BreakOverlay
              breakState={room.breakState}
              ntp={ntp}
              isHost={isHost}
              onEndBreak={endBreak}
            />

            {/* Fullscreen toggle button on player */}
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleContainerFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 border border-white/10 text-white backdrop-blur-md hover:bg-black/80 transition-all"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Player Controls & Participant WebRTC Strip */}
          <div className="mt-3 space-y-3">
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

        {/* Desktop Chat Panel */}
        <div className="hidden md:flex">
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
          {/* Top Video Player (Fixed 16:9 Aspect Ratio) */}
          <div
            ref={playerContainerRef}
            className="relative w-full aspect-video bg-black shrink-0 overflow-hidden border-b border-border-hairline shadow-md"
          >
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
              />
            )}
            {activeTab === 'screen' && (
              <ScreenShareSource
                source={room.source}
                isHost={isHost}
                onUpdateSource={setSource}
              />
            )}

            {/* Overlays */}
            <EmojiReactions
              reactions={floatingReactions}
              onSendReaction={sendReaction}
            />
            <CountdownOverlay countdown={room.countdown} ntp={ntp} />
            <BreakOverlay
              breakState={room.breakState}
              ntp={ntp}
              isHost={isHost}
              onEndBreak={endBreak}
            />

            {/* Mobile Fullscreen Action */}
            <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleContainerFullscreen}
                className="flex h-7 w-7 items-center justify-center rounded bg-black/70 border border-white/20 text-white backdrop-blur-md"
              >
                {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* JioHotstar Style Tab Switcher: [💬 Live Chat (N)] vs [👥 Party & Audio (N)] */}
          <div className="flex items-center justify-between border-b border-border-hairline bg-surface-elevated/90 px-3 py-1.5 shrink-0">
            <div className="flex items-center gap-2">
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
                <span>Party & Audio</span>
                <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                  {room.participants.length}
                </span>
              </button>
            </div>

            {/* Quick sync indicator / lock badge on mobile */}
            <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              {isHost ? (
                <span className="text-amber-accent font-semibold">Host</span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" /> Synced
                </span>
              )}
            </span>
          </div>

          {/* Mobile Body Area: Fills remaining vertical height completely */}
          <div className="flex flex-1 min-h-0 w-full overflow-hidden">
            {mobileTab === 'chat' ? (
              <ChatPanel
                isMobileEmbedded={true}
                messages={messages}
                onSendMessage={sendChatMessage}
                onSendReaction={sendReaction}
                isOpen={true}
              />
            ) : (
              <div className="flex flex-1 flex-col overflow-y-auto p-3 space-y-3">
                {/* Host Source Selector (if host) */}
                {isHost && (
                  <div className="rounded-xl border border-border-hairline bg-surface-card p-2.5 space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                      Stream Source (Host Control)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['ott', 'youtube', 'file', 'screen'] as MediaSourceType[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => handleTabChange(tab)}
                          className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                            activeTab === tab
                              ? 'bg-amber-accent text-background font-semibold'
                              : 'bg-surface border border-border-hairline text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sourceLabels[tab]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player Play/Pause and Seek Bar */}
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

                {/* Participant Camera & Mic Grid */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Participants ({room.participants.length})
                  </span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
