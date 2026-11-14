'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaSourceState, PlayerState, FileFingerprint } from '@shared/types';
import { FileVideo, AlertTriangle, CheckCircle, Upload } from 'lucide-react';

export interface VideoFileSourceProps {
  source: MediaSourceState;
  player: PlayerState;
  isHost: boolean;
  onUpdateSource: (source: MediaSourceState) => void;
  onPositionUpdate?: (pos: number) => void;
}

export function VideoFileSource({
  source,
  player,
  isHost,
  onUpdateSource,
  onPositionUpdate,
}: VideoFileSourceProps) {
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [localFingerprint, setLocalFingerprint] = useState<FileFingerprint | null>(null);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setLocalFileUrl(url);

    const fp: FileFingerprint = {
      name: file.name,
      size: file.size,
    };
    setLocalFingerprint(fp);

    if (isHost) {
      onUpdateSource({
        type: 'file',
        title: file.name,
        fileFingerprint: fp,
      });
    } else {
      // Guest verifies matching host fingerprint
      checkMismatch(fp, source.fileFingerprint);
    }
  };

  const checkMismatch = (local: FileFingerprint, host?: FileFingerprint) => {
    if (!host) return;
    if (local.name !== host.name || Math.abs(local.size - host.size) > 1024) {
      setMismatchWarning(
        `File mismatch! Host opened "${host.name}" (${(host.size / (1024 * 1024)).toFixed(1)} MB), but you loaded "${local.name}" (${(local.size / (1024 * 1024)).toFixed(1)} MB). Playback may drift.`
      );
    } else {
      setMismatchWarning(null);
    }
  };

  // Sync video element with player state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !localFileUrl) return;

    if (player.playing && video.paused) {
      video.play().catch(() => {});
    } else if (!player.playing && !video.paused) {
      video.pause();
    }

    // Check drift > 0.4s
    if (Math.abs(video.currentTime - player.position) > 0.4) {
      video.currentTime = player.position;
    }
  }, [player, localFileUrl]);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 h-full min-h-[380px] bg-black">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {mismatchWarning && (
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-accent" />
          <span>{mismatchWarning}</span>
        </div>
      )}

      {localFileUrl ? (
        <video
          ref={videoRef}
          src={localFileUrl}
          controls={false}
          playsInline
          className="h-full w-full max-h-[500px] rounded-xl object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center max-w-md p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-dim text-amber-accent mb-4 border border-amber-border/40 shadow-glow">
            <FileVideo className="h-8 w-8" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-white">Watch Local Video Together</h3>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Everyone opens their own copy of the same file. Nothing is uploaded to any server; it plays directly from your device in sync with the party.
          </p>

          {source.fileFingerprint && (
            <div className="my-4 rounded-xl border border-white/10 bg-surface-elevated px-4 py-2.5 text-xs text-zinc-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Host loaded: <strong className="text-white">{source.fileFingerprint.name}</strong></span>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex items-center gap-2 rounded-full bg-amber-accent px-6 py-3 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            <Upload className="h-4 w-4" />
            <span>Choose a video file</span>
          </button>
        </div>
      )}
    </div>
  );
}

