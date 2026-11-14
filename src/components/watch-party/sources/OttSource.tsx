'use client';

import React, { useState } from 'react';
import { MediaSourceState } from '@shared/types';
import { Tv, ExternalLink, Film, Check } from 'lucide-react';
import { FIXTURE_MOVIES } from '@/data/fixtures';

export interface OttSourceProps {
  source: MediaSourceState;
  isHost: boolean;
  onUpdateSource: (source: MediaSourceState) => void;
}

const OTT_SERVICES = [
  { name: 'Netflix', url: 'https://www.netflix.com', color: '#E50914' },
  { name: 'Prime Video', url: 'https://www.primevideo.com', color: '#00A8E1' },
  { name: 'JioHotstar', url: 'https://www.hotstar.com', color: '#1052CA' },
  { name: 'Apple TV+', url: 'https://tv.apple.com', color: '#333333' },
  { name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000' },
];

export function OttSource({ source, isHost, onUpdateSource }: OttSourceProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelectMovie = (title: string, ottPlatform: string) => {
    onUpdateSource({
      type: 'ott',
      title,
      ottPlatform,
    });
    setPickerOpen(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 sm:p-12 text-center h-full min-h-[380px] bg-gradient-to-b from-surface/80 to-surface-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-dim text-amber-accent border border-amber-border/40 shadow-glow mb-4">
        <Tv className="h-8 w-8" />
      </div>

      <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
        {source.title || 'Pick a film or show'}
      </h3>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed">
        Everyone plays it on their own app. Open it on Netflix, Prime Video, JioHotstar or your favorite service, get everyone ready, and the host presses play.
      </p>

      {/* Quick Launch OTT Links */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {OTT_SERVICES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-border-hairline bg-surface-elevated px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-amber-border transition-colors"
          >
            <span>{s.name}</span>
            <ExternalLink className="h-3 w-3 text-zinc-500" />
          </a>
        ))}
      </div>

      {isHost && (
        <div className="mt-8">
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 rounded-full bg-amber-accent px-5 py-2.5 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            <Film className="h-4 w-4" />
            <span>Pick a film or show</span>
          </button>
        </div>
      )}

      {/* Film Picker Modal for Host */}
      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border-hairline bg-surface-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif text-lg font-bold text-white mb-1">Pick Party Title</h4>
            <p className="text-xs text-zinc-400 mb-4">Select what everyone should load on their streaming service:</p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {FIXTURE_MOVIES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMovie(m.title, m.providers?.stream?.[0] || 'Any OTT')}
                  className="flex w-full items-center justify-between rounded-xl border border-border-hairline bg-surface-elevated p-3 text-left hover:border-amber-border transition-colors"
                >
                  <div>
                    <span className="text-xs font-semibold text-white block">{m.title} ({m.releaseYear})</span>
                    <span className="text-[11px] text-zinc-400">Stream on: {m.providers?.stream?.join(', ') || 'Any OTT'}</span>
                  </div>
                  {source.title === m.title ? (
                    <Check className="h-4 w-4 text-amber-accent" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border-hairline flex justify-end">
              <button
                onClick={() => setPickerOpen(false)}
                className="rounded-full bg-white/10 px-4 py-2 text-xs text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

