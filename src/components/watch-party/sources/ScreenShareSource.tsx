'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaSourceState } from '@shared/types';
import { ScreenShare, AlertCircle, StopCircle } from 'lucide-react';

export interface ScreenShareSourceProps {
  source: MediaSourceState;
  isHost: boolean;
  onUpdateSource: (source: MediaSourceState) => void;
}

export function ScreenShareSource({ source, isHost, onUpdateSource }: ScreenShareSourceProps) {
  const [supported, setSupported] = useState(true);
  const [sharing, setSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasDisplayMedia = Boolean(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices);
      setSupported(hasDisplayMedia);
    }
  }, []);

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setSharing(true);

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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSharing(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 h-full min-h-[380px] bg-black text-center">
      {sharing ? (
        <div className="relative h-full w-full flex flex-col items-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full max-h-[500px] object-contain rounded-xl"
          />
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
            Share a browser tab with sound for the best experience. Netflix, Prime Video and other paid streaming apps block screen capture, so use <strong>Any OTT</strong> for those.
          </p>

          {!supported ? (
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Screen sharing is not supported on this mobile device browser. You can still watch when desktop friends share!</span>
            </div>
          ) : isHost ? (
            <button
              onClick={startScreenShare}
              className="mt-6 flex items-center gap-2 rounded-full bg-amber-accent px-6 py-3 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
            >
              <ScreenShare className="h-4 w-4" />
              <span>Share my screen</span>
            </button>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-hairline bg-surface/80 px-4 py-2 text-xs text-zinc-400">
              <div className="h-2 w-2 rounded-full bg-amber-accent animate-ping" />
              <span>Waiting for host to share screen...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

