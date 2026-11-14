'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaSourceState, PlayerState } from '@shared/types';
import { Youtube, AlertCircle } from 'lucide-react';

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
}: YouTubeSourceProps) {
  const [inputUrl, setInputText] = useState(source.url || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const currentVideoId = extractYouTubeId(source.url || '');

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const videoId = extractYouTubeId(inputUrl.trim());
    if (!videoId) {
      setErrorMsg('Invalid YouTube URL. Please enter a valid youtu.be or youtube.com link.');
      return;
    }
    onUpdateSource({
      type: 'youtube',
      url: inputUrl.trim(),
      title: `YouTube Video (${videoId})`,
    });
  };

  const iframeSrc = currentVideoId
    ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=${
        player.playing ? '1' : '0'
      }&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
    : null;

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* YouTube URL Input Bar (Host controlled) */}
      {isHost && (
        <form
          onSubmit={handleLoadVideo}
          className="flex items-center gap-2 p-3 bg-surface-elevated border-b border-border-hairline"
        >
          <Youtube className="h-4 w-4 text-rose-500 shrink-0 ml-1" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
            className="flex-1 rounded-xl border border-border-hairline bg-surface px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-accent px-4 py-2 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            Load
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Video Viewport */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[460px] flex items-center justify-center">
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            title="YouTube Watch Party Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
              <Youtube className="h-8 w-8" />
            </div>
            <h4 className="font-serif text-xl font-bold text-white">Watch YouTube Together</h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Paste any public YouTube link above to play, pause, and seek in perfect sync with your friends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

