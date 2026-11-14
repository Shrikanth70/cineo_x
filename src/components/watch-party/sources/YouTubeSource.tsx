'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaSourceState, PlayerState } from '@shared/types';
import { Youtube, AlertCircle, Edit3, X, Check, RefreshCw } from 'lucide-react';

export interface YouTubeSourceProps {
  source: MediaSourceState;
  player: PlayerState;
  isHost: boolean;
  onUpdateSource: (source: MediaSourceState) => void;
  onPlayerSeek: (pos: number) => void;
  onPlayerPlay: (pos: number) => void;
  onPlayerPause: (pos: number) => void;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function YouTubeSource({
  source,
  player,
  isHost,
  onUpdateSource,
  onPlayerSeek,
  onPlayerPlay,
  onPlayerPause,
}: YouTubeSourceProps) {
  const [inputUrl, setInputText] = useState(source.url || '');
  const [editingUrl, setEditingUrl] = useState(!source.url);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSyncPosRef = useRef<number>(-1);
  const lastPlayingStateRef = useRef<boolean | null>(null);

  const currentVideoId = extractYouTubeId(source.url || '');

  useEffect(() => {
    if (source.url) {
      setInputText(source.url);
      setEditingUrl(false);
    }
  }, [source.url]);

  // Send command to YouTube iframe via official PostMessage API
  const postPlayerCommand = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  // Compute authoritative host playback position
  const getHostLivePosition = useCallback(() => {
    return Math.max(
      0,
      player.position +
        (player.playing && player.serverTs
          ? ((Date.now() - player.serverTs) / 1000) * (player.rate || 1)
          : 0)
    );
  }, [player]);

  // Handle iframe messages & readiness
  useEffect(() => {
    const handleWindowMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data !== 'string') return;
        const data = JSON.parse(e.data);
        if (data.event === 'onReady') {
          setPlayerReady(true);
          const pos = getHostLivePosition();
          postPlayerCommand('seekTo', [pos, true]);
          if (player.playing) {
            postPlayerCommand('playVideo');
          } else {
            postPlayerCommand('pauseVideo');
          }
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [getHostLivePosition, player.playing, postPlayerCommand]);

  // Synchronize playback state via postMessage without reloading iframe
  useEffect(() => {
    const targetPos = getHostLivePosition();

    // Sync play/pause state
    if (lastPlayingStateRef.current !== player.playing) {
      lastPlayingStateRef.current = player.playing;
      if (player.playing) {
        postPlayerCommand('seekTo', [targetPos, true]);
        postPlayerCommand('playVideo');
      } else {
        postPlayerCommand('pauseVideo');
        postPlayerCommand('seekTo', [player.position, true]);
      }
      lastSyncPosRef.current = targetPos;
      return;
    }

    // Sync seek state if host jumped position (>2s drift)
    if (Math.abs(player.position - lastSyncPosRef.current) > 2) {
      lastSyncPosRef.current = targetPos;
      postPlayerCommand('seekTo', [targetPos, true]);
    }
  }, [player.playing, player.position, player.serverTs, getHostLivePosition, postPlayerCommand]);

  const handleManualResync = () => {
    const target = getHostLivePosition();
    postPlayerCommand('seekTo', [target, true]);
    if (player.playing) {
      postPlayerCommand('playVideo');
    }
  };

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const videoId = extractYouTubeId(inputUrl.trim());
    if (!videoId) {
      setErrorMsg('Invalid YouTube link. Please enter a valid youtube.com or youtu.be URL.');
      return;
    }
    onUpdateSource({
      type: 'youtube',
      url: inputUrl.trim(),
      title: `YouTube Video (${videoId})`,
    });
    setEditingUrl(false);
  };

  // Stable iframe URL: NEVER changes on re-renders, only when currentVideoId changes!
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const initialLivePos = Math.floor(getHostLivePosition());
  const iframeSrc = currentVideoId
    ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?enablejsapi=1&origin=${encodeURIComponent(
        origin
      )}&playsinline=1&start=${initialLivePos}&autoplay=1`
    : null;

  return (
    <div className="relative flex flex-col h-full w-full bg-black overflow-hidden">
      {/* Floating Host URL Bar */}
      {isHost && editingUrl && (
        <div className="absolute top-2 left-2 right-2 z-30 flex flex-col gap-1 rounded-xl bg-black/90 p-2 border border-white/15 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleLoadVideo} className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-rose-500 shrink-0 ml-1" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
              autoFocus
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-accent px-3 py-1.5 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Load</span>
            </button>
            {source.url && (
              <button
                type="button"
                onClick={() => setEditingUrl(false)}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          {errorMsg && (
            <p className="px-2 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>
      )}

      {/* Host Edit Button & Viewer Manual Resync Button in Corner */}
      <div className="absolute top-2 right-12 z-20 flex items-center gap-1.5">
        {!isHost && currentVideoId && (
          <button
            type="button"
            onClick={handleManualResync}
            title="Force resync with host live timeline"
            className="flex items-center gap-1 rounded-full bg-black/70 border border-white/15 px-2.5 py-1 text-[11px] text-emerald-300 backdrop-blur-md hover:bg-black/90 transition-all shadow-md"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Resync</span>
          </button>
        )}

        {isHost && !editingUrl && currentVideoId && (
          <button
            type="button"
            onClick={() => setEditingUrl(true)}
            title="Change YouTube Video"
            className="flex items-center gap-1.5 rounded-full bg-black/70 border border-white/15 px-2.5 py-1 text-[11px] text-zinc-300 backdrop-blur-md hover:bg-black/90 hover:text-white transition-all shadow-md"
          >
            <Edit3 className="h-3 w-3 text-amber-accent" />
            <span className="hidden sm:inline">Change Video</span>
          </button>
        )}
      </div>

      {/* Responsive 16:9 Iframe Stage */}
      <div className="relative w-full h-full flex-1 flex items-center justify-center bg-black">
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            key={currentVideoId}
            src={iframeSrc}
            title="YouTube Watch Party Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full object-contain border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 max-w-md mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-3 border border-rose-500/20">
              <Youtube className="h-7 w-7" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white">Watch YouTube Together</h4>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              {isHost
                ? 'Paste any public YouTube video link to stream in sync with everyone.'
                : 'Waiting for host to pick a YouTube video...'}
            </p>
            {isHost && !editingUrl && (
              <button
                type="button"
                onClick={() => setEditingUrl(true)}
                className="mt-4 rounded-full bg-amber-accent px-5 py-2 text-xs font-semibold text-background shadow-glow hover:bg-amber-hover transition-colors"
              >
                Paste YouTube link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
