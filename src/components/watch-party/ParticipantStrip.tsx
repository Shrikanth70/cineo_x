'use client';

import React, { useRef, useEffect } from 'react';
import { Participant, AVATARS } from '@shared/types';
import { Crown, Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';

export interface ParticipantStripProps {
  participants: Participant[];
  myId: string;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  localMuted: boolean;
  localCameraOn: boolean;
  localStream?: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
}

function VideoTile({ stream, isMuted }: { stream: MediaStream | null; isMuted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="absolute inset-0 h-full w-full object-cover rounded-xl"
    />
  );
}

export function ParticipantStrip({
  participants,
  myId,
  onToggleMic,
  onToggleCamera,
  localMuted,
  localCameraOn,
  localStream,
  remoteStreams,
}: ParticipantStripProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 scrollbar-none">
      {participants.map((p) => {
        const isMe = p.id === myId;
        const meta = AVATARS[p.avatar] || AVATARS.popcorn;
        const isMuted = isMe ? localMuted : p.isMuted;
        const hasCamera = isMe ? localCameraOn : p.cameraOn;
        const peerStream = !isMe && remoteStreams ? remoteStreams.get(p.id) || null : null;

        // When participant has camera on: render prominent, visible camera card
        if (hasCamera) {
          return (
            <div
              key={p.id}
              className="relative flex flex-col justify-between rounded-xl border-2 border-emerald-400/80 bg-black w-32 sm:w-36 h-24 sm:h-28 overflow-hidden shrink-0 shadow-lg"
            >
              <div className="absolute inset-0">
                {isMe && localStream ? (
                  <VideoTile stream={localStream} isMuted={true} />
                ) : !isMe && peerStream ? (
                  <VideoTile stream={peerStream} isMuted={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    {meta.emoji}
                  </div>
                )}
              </div>

              {/* Top overlay: Name & Host crown */}
              <div className="relative z-10 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/80 to-transparent">
                <span className="flex items-center gap-1 min-w-0">
                  {p.isHost && (
                    <Crown className="h-3 w-3 text-amber-accent fill-amber-accent shrink-0" />
                  )}
                  <span className="text-[10px] font-semibold text-white truncate max-w-[80px]">
                    {p.name} {isMe ? '(You)' : ''}
                  </span>
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    p.isReady ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                />
              </div>

              {/* Bottom overlay: Mic toggle */}
              <div className="relative z-10 flex items-center justify-between p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                {isMe ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onToggleMic}
                      className={`p-1 rounded-full ${
                        localMuted
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/60 text-emerald-400'
                      }`}
                      title={localMuted ? 'Unmute' : 'Mute'}
                    >
                      {localMuted ? (
                        <MicOff className="h-2.5 w-2.5" />
                      ) : (
                        <Mic className="h-2.5 w-2.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onToggleCamera}
                      className="p-1 rounded-full bg-amber-accent text-background"
                      title="Turn camera off"
                    >
                      <Video className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="p-1 rounded-full bg-black/60">
                    {isMuted ? (
                      <MicOff className="h-2.5 w-2.5 text-rose-400" />
                    ) : (
                      <Mic className="h-2.5 w-2.5 text-emerald-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // When camera is off: render sleek avatar capsule
        return (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-card/90 px-2.5 py-1.5 shrink-0 shadow-sm transition-all hover:border-white/20"
          >
            {/* Round Avatar Container */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-lg border border-white/10 overflow-hidden shrink-0">
              <span>{meta.emoji}</span>
              <span
                className={`absolute top-0 right-0 h-2 w-2 rounded-full ring-1 ring-black ${
                  p.isReady ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
                title={p.isReady ? 'Ready' : 'Not ready'}
              />
            </div>

            {/* Name + Crown */}
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-[11px] font-medium text-zinc-200 max-w-[85px]">
                  {p.name}
                </span>
                {p.isHost && (
                  <Crown className="h-3 w-3 text-amber-accent fill-amber-accent shrink-0" />
                )}
                {p.handRaised && (
                  <Hand className="h-3 w-3 text-amber-accent animate-pulse shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-zinc-400">
                {isMe ? 'You' : p.isHost ? 'Host' : 'Friend'}
              </span>
            </div>

            {/* Mic / Camera Quick Toggles for 'Me' */}
            {isMe ? (
              <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                <button
                  type="button"
                  onClick={onToggleMic}
                  className={`p-1 rounded-full text-xs transition-colors ${
                    localMuted
                      ? 'text-rose-400 hover:text-rose-300'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                  title={localMuted ? 'Unmute' : 'Mute'}
                >
                  {localMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleCamera}
                  className={`p-1 rounded-full text-xs transition-colors ${
                    !localCameraOn
                      ? 'text-zinc-500 hover:text-zinc-400'
                      : 'text-amber-accent hover:text-amber-300'
                  }`}
                  title={localCameraOn ? 'Turn camera off' : 'Turn camera on'}
                >
                  {localCameraOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                </button>
              </div>
            ) : (
              <div className="border-l border-white/10 pl-1 text-zinc-500">
                {isMuted ? (
                  <MicOff className="h-3 w-3 text-rose-400/80" />
                ) : (
                  <Mic className="h-3 w-3 text-emerald-400" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
