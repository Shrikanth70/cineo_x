'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaSourceState, PlayerState, FileFingerprint } from '@shared/types';
import { FileVideo, AlertTriangle, CheckCircle, Upload, Radio, Volume2 } from 'lucide-react';

export interface VideoFileSourceProps {
  source: MediaSourceState;
  player: PlayerState;
  isHost: boolean;
  onUpdateSource: (source: MediaSourceState) => void;
  onPositionUpdate?: (pos: number) => void;
  broadcastStream?: MediaStream | null;
  onStartBroadcast?: (stream: MediaStream) => void;
  onStopBroadcast?: () => void;
}

export function VideoFileSource({
  source,
  player,
  isHost,
  onUpdateSource,
  onPositionUpdate,
  broadcastStream,
  onStartBroadcast,
  onStopBroadcast,
}: VideoFileSourceProps) {
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [localFingerprint, setLocalFingerprint] = useState<FileFingerprint | null>(null);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
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

  // Host starts capturing and broadcasting video stream over WebRTC
  const captureAndBroadcastHostVideo = () => {
    const video = videoRef.current;
    if (!video || !isHost) return;

    try {
      const stream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream
        ? (video as any).mozCaptureStream()
        : null;

      if (stream) {
        onStartBroadcast?.(stream);
      }
    } catch (err) {
      console.warn('captureStream error or restricted:', err);
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

  // Sync local video element with room player state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !localFileUrl) return;

    if (player.playing && video.paused) {
      video.play().catch(() => {});
    } else if (!player.playing && !video.paused) {
      video.pause();
    }

    // Authoritative target accounting for elapsed playback time since server sync
    const target =
      player.playing && player.serverTs
        ? player.position + ((Date.now() - player.serverTs) / 1000) * (player.rate || 1)
        : player.position;

    // Resync when drift exceeds 0.5s
    if (Math.abs(video.currentTime - target) > 0.5) {
      video.currentTime = target;
    }
  }, [player, localFileUrl]);

  // Hook remote broadcast stream for viewers without a local file
  useEffect(() => {
    if (!isHost && !localFileUrl && viewerVideoRef.current && broadcastStream) {
      viewerVideoRef.current.srcObject = broadcastStream;
      viewerVideoRef.current
        .play()
        .then(() => {
          setAudioBlocked(false);
        })
        .catch(() => {
          if (viewerVideoRef.current) {
            viewerVideoRef.current.muted = true;
            viewerVideoRef.current.play().catch(() => {});
            setAudioBlocked(true);
          }
        });
    }
  }, [isHost, localFileUrl, broadcastStream]);

  const handleUnmute = () => {
    if (viewerVideoRef.current) {
      viewerVideoRef.current.muted = false;
      viewerVideoRef.current.play().catch(() => {});
      setAudioBlocked(false);
    }
  };

  const hasRemoteBroadcast = Boolean(
    broadcastStream &&
    broadcastStream.getVideoTracks().some((t) => t.readyState === 'live')
  );

  return (
    <div className="relative flex flex-col items-center justify-center p-3 sm:p-6 h-full min-h-[380px] bg-black">
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

      {/* Case 1: Local file is chosen (Host or Guest with local copy) */}
      {localFileUrl ? (
        <div className="relative h-full w-full flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            src={localFileUrl}
            controls={false}
            playsInline
            onLoadedMetadata={captureAndBroadcastHostVideo}
            onPlay={captureAndBroadcastHostVideo}
            className="h-full w-full max-h-[500px] rounded-xl object-contain"
          />

          {isHost && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>Broadcasting video to room</span>
            </div>
          )}
        </div>
      ) : isHost ? (
        /* Case 2: Host hasn't chosen a video file yet */
        <div className="flex flex-col items-center justify-center text-center max-w-md p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-dim text-amber-accent mb-4 border border-amber-border/40 shadow-glow">
            <FileVideo className="h-8 w-8" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-white">Stream Local Video</h3>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Select any video file from your computer. It will stream live to all mobile and desktop guests in the party!
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 flex items-center gap-2 rounded-full bg-amber-accent px-6 py-3 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            <Upload className="h-4 w-4" />
            <span>Choose a video file</span>
          </button>
        </div>
      ) : hasRemoteBroadcast ? (
        /* Case 3: Viewer watching Host's live video stream over WebRTC (Mobile / Desktop) */
        <div className="relative h-full w-full flex flex-col items-center justify-center">
          <video
            ref={viewerVideoRef}
            autoPlay
            playsInline
            className="h-full w-full max-h-[500px] object-contain rounded-xl"
          />

          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/70 border border-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Host Video Stream · Live</span>
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

          <div className="absolute bottom-3 right-3 z-20">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-black/60 border border-white/10 px-3 py-1 text-[10px] text-zinc-300 hover:text-white backdrop-blur-md"
            >
              Have this file? Load local copy
            </button>
          </div>
        </div>
      ) : (
        /* Case 4: Viewer waiting for host to select / play video */
        <div className="flex flex-col items-center justify-center text-center max-w-md p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-dim text-amber-accent mb-4 border border-amber-border/40 shadow-glow">
            <FileVideo className="h-8 w-8" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-white">Local Video Party</h3>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The host is streaming a local video. As soon as the host plays the file, the stream will appear here in real time.
          </p>

          {source.fileFingerprint && (
            <div className="my-4 rounded-xl border border-white/10 bg-surface-elevated px-4 py-2.5 text-xs text-zinc-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Host loaded: <strong className="text-white">{source.fileFingerprint.name}</strong></span>
            </div>
          )}

          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-hairline bg-surface/80 px-4 py-2 text-xs text-zinc-400">
              <div className="h-2 w-2 rounded-full bg-amber-accent animate-ping" />
              <span>Waiting for host to start video...</span>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-zinc-400 hover:text-amber-accent transition-colors underline"
            >
              Or choose local copy from your device
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
