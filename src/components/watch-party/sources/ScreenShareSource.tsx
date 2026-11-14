'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaSourceState } from '@shared/types';
import { ScreenShare, AlertCircle, StopCircle, Radio, Volume2 } from 'lucide-react';

export interface ScreenShareSourceProps {
  source: MediaSourceState;
  isHost: boolean;
  onUpdateSource: (source: MediaSourceState) => void;
  broadcastStream?: MediaStream | null;
  onStartBroadcast?: (stream: MediaStream) => void;
  onStopBroadcast?: () => void;
}

export function ScreenShareSource({
  source,
  isHost,
  onUpdateSource,
  broadcastStream,
  onStartBroadcast,
  onStopBroadcast,
}: ScreenShareSourceProps) {
  const [supported, setSupported] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasDisplayMedia = Boolean(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices);
      setSupported(hasDisplayMedia);
    }
  }, []);

  // Hook remote broadcast stream to viewer video element
  useEffect(() => {
    if (!isHost && viewerVideoRef.current && broadcastStream) {
      viewerVideoRef.current.srcObject = broadcastStream;
      viewerVideoRef.current
        .play()
        .then(() => {
          setAudioBlocked(false);
        })
        .catch(() => {
          // Autoplay policy fallback for mobile
          if (viewerVideoRef.current) {
            viewerVideoRef.current.muted = true;
            viewerVideoRef.current.play().catch(() => {});
            setAudioBlocked(true);
          }
        });
    }
  }, [isHost, broadcastStream]);

  const handleUnmute = () => {
    if (viewerVideoRef.current) {
      viewerVideoRef.current.muted = false;
      viewerVideoRef.current.play().catch(() => {});
      setAudioBlocked(false);
    }
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (hostVideoRef.current) {
        hostVideoRef.current.srcObject = stream;
        hostVideoRef.current.play().catch(() => {});
      }
      setSharing(true);

      // Broadcast screen share stream to all peers via WebRTC
      onStartBroadcast?.(stream);

      onUpdateSource({
        type: 'screen',
        title: 'Host Screen Share',
      });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch {
      setSharing(false);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (hostVideoRef.current) {
      hostVideoRef.current.srcObject = null;
    }
    setSharing(false);
    onStopBroadcast?.();
  };

  const hasRemoteBroadcast = Boolean(
    broadcastStream &&
    broadcastStream.getVideoTracks().some((t) => t.readyState === 'live')
  );

  return (
    <div className="relative flex flex-col items-center justify-center p-3 sm:p-6 h-full min-h-[380px] bg-black text-center">
      {isHost ? (
        sharing ? (
          <div className="relative h-full w-full flex flex-col items-center justify-center">
            <video
              ref={hostVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full max-h-[500px] object-contain rounded-xl"
            />
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>Broadcasting screen to room</span>
            </div>
            <button
              onClick={stopScreenShare}
              className="mt-4 flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition-colors shadow-lg"
            >
              <StopCircle className="h-4 w-4" />
              <span>Stop Sharing</span>
            </button>
          </div>
        ) : (
          <div className="max-w-md p-6 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-dim text-amber-accent mb-4 border border-amber-border/40 shadow-glow">
              <ScreenShare className="h-8 w-8" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-white">Share Your Screen</h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Share a browser tab, window, or desktop with audio. Your stream will be broadcast live over WebRTC to all participants on mobile and desktop.
            </p>

            <button
              onClick={startScreenShare}
              className="mt-6 flex items-center gap-2 rounded-full bg-amber-accent px-6 py-3 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
            >
              <ScreenShare className="h-4 w-4" />
              <span>Share my screen</span>
            </button>
          </div>
        )
      ) : hasRemoteBroadcast ? (
        <div className="relative h-full w-full flex flex-col items-center justify-center">
          <video
            ref={viewerVideoRef}
            autoPlay
            playsInline
            className="h-full w-full max-h-[500px] object-contain rounded-xl"
          />
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/70 border border-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Host Screen Share · Live</span>
          </div>

          {audioBlocked && (
            <button
              type="button"
              onClick={handleUnmute}
              className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-amber-accent px-4 py-2 text-xs font-semibold text-background shadow-lg hover:bg-amber-hover transition-colors"
            >
              <Volume2 className="h-4 w-4" />
              <span>Tap to enable sound</span>
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-md p-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-dim text-amber-accent mb-4 border border-amber-border/40 shadow-glow">
            <ScreenShare className="h-8 w-8" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-white">Host Screen Share</h3>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The host has selected Screen Share. When the host starts streaming from desktop, the video and audio will appear here in real time.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-hairline bg-surface/80 px-4 py-2 text-xs text-zinc-400">
            <div className="h-2 w-2 rounded-full bg-amber-accent animate-ping" />
            <span>Waiting for host to share screen...</span>
          </div>
        </div>
      )}
    </div>
  );
}
