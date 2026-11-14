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
      audioRef.current.play().catch(() => {});
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
    <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 scrollbar-none">
      {participants.map((p) => {
        const isMe = p.id === myId;
        const meta = AVATARS[p.avatar] || AVATARS.popcorn;
        const isMuted = isMe ? localMuted : p.isMuted;
        const hasCamera = isMe ? localCameraOn : p.cameraOn;
        const peerStream = !isMe && remoteStreams ? remoteStreams.get(p.id) || null : null;

        return (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-card/90 px-2.5 py-1.5 shrink-0 shadow-sm transition-all hover:border-white/20"
          >
            {/* Round Avatar Container */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-lg border border-white/10 overflow-hidden shrink-0">
              {isMe && hasCamera && localStream ? (
                <VideoTile stream={localStream} isMuted={true} />
              ) : !isMe && hasCamera && peerStream ? (
                <VideoTile stream={peerStream} isMuted={false} />
              ) : (
                <span>{meta.emoji}</span>
              )}

              {/* Background remote audio playback */}
              {!isMe && peerStream && <RemoteAudio stream={peerStream} />}

              {/* Ready status indicator dot */}
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

            {/* Mic / Camera State or Quick Actions for 'Me' */}
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
