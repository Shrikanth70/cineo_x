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
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="absolute inset-0 h-full w-full object-cover rounded-full"
    />
  );
}

function RemoteAudio({ stream }: { stream: MediaStream | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {
        // Handled: browser autoplay policy will resume audio on next user interaction
      });
    }
  }, [stream]);

  if (!stream) return null;

  return <audio ref={audioRef} autoPlay playsInline />;
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
    <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
      {participants.map((p) => {
        const isMe = p.id === myId;
        const meta = AVATARS[p.avatar] || AVATARS.popcorn;
        const isMuted = isMe ? localMuted : p.isMuted;
        const hasCamera = isMe ? localCameraOn : p.cameraOn;
        const peerStream = !isMe && remoteStreams ? remoteStreams.get(p.id) || null : null;

        return (
          <div
            key={p.id}
            className={`relative flex flex-col items-center justify-between rounded-xl border p-2.5 min-w-[90px] sm:min-w-[105px] h-28 bg-surface-card transition-all ${
              p.handRaised
                ? 'border-amber-accent shadow-glow'
                : 'border-border-hairline hover:border-zinc-600'
            }`}
          >
            {/* Top Status Indicators (Crown, Hand, Ready) */}
            <div className="flex w-full items-center justify-between">
              {p.isHost ? (
                <span title="Party Host" className="text-amber-accent">
                  <Crown className="h-3.5 w-3.5 fill-amber-accent" />
                </span>
              ) : (
                <span />
              )}

              {p.handRaised && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-dim px-1 text-[10px] text-amber-accent font-semibold animate-pulse">
                  <Hand className="h-2.5 w-2.5" />
                </span>
              )}

              <span
                className={`h-2 w-2 rounded-full ${
                  p.isReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'
                }`}
                title={p.isReady ? 'Ready' : 'Not ready'}
              />
            </div>

            {/* Avatar / Camera Placeholder */}
            <div className="relative my-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-2xl border border-white/5 overflow-hidden">
              {isMe && hasCamera && localStream ? (
                <VideoTile stream={localStream} isMuted={true} />
              ) : !isMe && hasCamera && peerStream ? (
                <VideoTile stream={peerStream} isMuted={false} />
              ) : (
                <span>{meta.emoji}</span>
              )}

              {/* Background remote audio playback */}
              {!isMe && peerStream && <RemoteAudio stream={peerStream} />}

              {p.movieModeMic && isMe && (
                <div
                  title="Movie-mode mic active"
                  className="absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-amber-accent text-background text-[9px] font-bold"
                >
                  M
                </div>
              )}
            </div>

            {/* Name + Audio/Video Control */}
            <div className="flex w-full items-center justify-between pt-1 text-[11px]">
              <span className="truncate text-zinc-200 font-medium max-w-[55px] sm:max-w-[65px]">
                {p.name} {isMe ? '(you)' : ''}
              </span>

              {isMe ? (
                <div className="flex items-center gap-1 z-10">
                  <button
                    onClick={onToggleMic}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    className={`rounded p-0.5 ${
                      isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={onToggleCamera}
                    title={hasCamera ? 'Turn off camera' : 'Turn on camera'}
                    className={`rounded p-0.5 ${
                      hasCamera ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {hasCamera ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {isMuted ? (
                    <span title="Muted"><MicOff className="h-3 w-3 text-zinc-600" /></span>
                  ) : (
                    <span title="Speaking"><Mic className="h-3 w-3 text-emerald-400" /></span>
                  )}
                  {hasCamera ? (
                    <span title="Camera on"><Video className="h-3 w-3 text-emerald-400" /></span>
                  ) : (
                    <span title="Camera off"><VideoOff className="h-3 w-3 text-zinc-600" /></span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
