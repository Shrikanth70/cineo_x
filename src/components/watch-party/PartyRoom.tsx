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
import { Share2, Check, MessageSquare, AlertCircle, Wifi } from 'lucide-react';

export interface PartyRoomProps {
  roomCode: string;
}

export function PartyRoom({ roomCode }: PartyRoomProps) {
  const rtcManagerRef = useRef<WebRtcMeshManager | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

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
  } = useWatchParty({ roomCode, onRtcSignal: handleRtcSignal });

  const [activeTab, setActiveTab] = useState<MediaSourceType>('ott');
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [localCameraOn, setLocalCameraOn] = useState(false);

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
        rtcManagerRef.current?.initiateConnection(p.id);
      }
    });
  }, [room, myId]);

  // Sync active tab with room's current media source type
  useEffect(() => {
    if (room?.source?.type) {
      setActiveTab(room.source.type);
    }
  }, [room?.source?.type]);

  // Handle Space key for push-to-talk when movie-mode mic is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
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
    setActiveTab(tab);
    if (isHost && room) {
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

  if (!room) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-accent border-t-transparent mb-4" />
        <h2 className="font-serif text-xl font-bold text-white">Connecting to Cinéo Room...</h2>
        <p className="mt-1 text-xs text-zinc-400">Synchronizing with host and room presence.</p>
      </div>
    );
  }

  const participantCount = room.participants.length;
  const statusHeadline = participantCount <= 1 ? 'Waiting for friends · share the invite' : `${participantCount} friends watching`;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] w-full bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-hairline bg-surface/90 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base sm:text-lg font-bold text-white tracking-tight">
                {room.title}
              </h1>
              <span className="rounded bg-surface-elevated border border-border-hairline px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
                {room.code}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">{statusHeadline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400">
            <Wifi className="h-3 w-3 text-emerald-400" />
            <span className="capitalize">{status}</span>
          </div>

          {/* Copy / Share Invite Button */}
          <button
            onClick={handleShareInvite}
            className="flex items-center gap-1.5 rounded-full bg-amber-dim border border-amber-border px-3.5 py-1.5 text-xs font-semibold text-amber-accent hover:bg-amber-accent hover:text-background transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Invite'}</span>
          </button>

          {/* Mobile Chat Toggle Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-border-hairline bg-surface-elevated text-zinc-300 hover:text-white"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="flex items-center gap-2 bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Main Party Room Body: Media Player + Chat Panel */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left Side: Video Canvas & Controls */}
        <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-3 sm:p-5">
          {/* Source Tabs (Pill Group) */}
          <div className="flex items-center justify-center pb-3">
            <div className="flex items-center gap-1 rounded-full border border-border-hairline bg-surface-card p-1 shadow-inner">
              {(['ott', 'youtube', 'file', 'screen'] as MediaSourceType[]).map((tab) => {
                const labels: Record<MediaSourceType, string> = {
                  ott: 'Any OTT',
                  youtube: 'YouTube',
                  file: 'Video file',
                  screen: 'Screen share',
                };
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
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Player Viewport Container */}
          <div className="relative flex-1 rounded-2xl border border-border-hairline bg-black overflow-hidden flex flex-col justify-center shadow-2xl">
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

            {/* Docked Control Tools (bottom right of player) */}
            <div className="absolute bottom-3 right-3 z-30">
              <ControlDock
                handRaised={Boolean(currentParticipant?.handRaised)}
                onToggleHand={() => toggleHandRaised(Boolean(currentParticipant?.handRaised))}
                onToggleParticipants={() => setParticipantsOpen(!participantsOpen)}
                participantsOpen={participantsOpen}
                participantCount={room.participants.length}
              />
            </div>
          </div>

          {/* Bottom Player Bar & Reactions Bar */}
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

            {/* Participant Camera & Face Strip */}
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

        {/* Right Side: Chat Panel */}
        <ChatPanel
          messages={messages}
          onSendMessage={sendChatMessage}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </div>
    </div>
  );
}
