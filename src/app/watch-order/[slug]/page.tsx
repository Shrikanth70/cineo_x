'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FRANCHISES } from '@/data/fixtures';
import { Clock, Film, Sparkles, CheckCircle2, Circle, ArrowUpDown } from 'lucide-react';

export default function WatchOrderDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const franchise = FRANCHISES.find((f) => f.slug === slug) || FRANCHISES[0];

  const [orderMode, setOrderMode] = useState<'chronological' | 'release'>('release');
  const [watchedMap, setWatchedMap] = useState<Record<number, boolean>>({});

  const toggleWatched = (movieId: number) => {
    setWatchedMap((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  const sortedEntries = [...franchise.entries].sort((a, b) =>
    orderMode === 'chronological'
      ? a.chronologicalOrderIndex - b.chronologicalOrderIndex
      : a.releaseOrderIndex - b.releaseOrderIndex
  );

  const totalRuntimeMinutes = franchise.entries.reduce((acc, curr) => acc + curr.runtimeMinutes, 0);
  const watchedCount = Object.values(watchedMap).filter(Boolean).length;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/watch-order" className="hover:text-white transition-colors">
            Watch Order
          </Link>
          <span>/</span>
          <span className="text-zinc-200">{franchise.title}</span>
        </div>

        {/* Header Hero */}
        <div className="rounded-2xl border border-border-hairline bg-surface-card p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3 py-1 text-xs font-semibold text-amber-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Roadmap</span>
            </span>
            <div className="text-xs text-zinc-400 font-mono">
              Total binge: {(totalRuntimeMinutes / 60).toFixed(1)} hours ({franchise.filmsOutCount} movies)
            </div>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
            {franchise.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-sans leading-relaxed text-pretty">
            {franchise.description}
          </p>

          {/* Progress Tracker */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Your Watch Progress</span>
              <span className="font-semibold text-amber-accent">
                {watchedCount} / {franchise.entries.length} Watched
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-elevated overflow-hidden border border-white/5">
              <div
                className="h-full bg-amber-accent transition-all duration-300"
                style={{ width: `${(watchedCount / franchise.entries.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Toggle Order: Chronological vs Release Order */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ArrowUpDown className="h-4 w-4 text-amber-accent" />
            <span>Ordering Mode:</span>
          </div>

          <div className="flex rounded-full border border-border-hairline bg-surface-card p-1">
            <button
              onClick={() => setOrderMode('release')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                orderMode === 'release'
                  ? 'bg-amber-accent text-background font-semibold shadow-glow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Release Order (Recommended)
            </button>
            <button
              onClick={() => setOrderMode('chronological')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                orderMode === 'chronological'
                  ? 'bg-amber-accent text-background font-semibold shadow-glow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Chronological In-Universe
            </button>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-3.5">
          {sortedEntries.map((entry, idx) => {
            const isWatched = Boolean(watchedMap[entry.movieId]);
            return (
              <div
                key={entry.movieId}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                  isWatched
                    ? 'border-emerald-500/30 bg-surface-elevated/40 opacity-75'
                    : 'border-border-hairline bg-surface-card hover:border-amber-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Index Circle */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated font-serif font-bold text-amber-accent text-sm shrink-0 border border-white/5">
                    {idx + 1}
                  </div>

                  {/* Poster Thumbnail */}
                  <div className="relative h-20 w-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    <Image
                      src={entry.posterUrl}
                      alt={entry.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  {/* Title & Notes */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm sm:text-base text-white">
                        {entry.title} ({entry.releaseYear})
                      </h3>
                      {entry.postCreditScenes > 0 && (
                        <span className="rounded-full bg-amber-dim border border-amber-border px-2 py-0.2 text-[10px] font-semibold text-amber-accent">
                          {entry.postCreditScenes} Post-Credit Scene{entry.postCreditScenes > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.runtimeMinutes} min
                      </span>
                      {entry.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-zinc-400 text-[11px]">{entry.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action: Watched Checkbox & Watch Party Link */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => toggleWatched(entry.movieId)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {isWatched ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-500" />
                    )}
                    <span>{isWatched ? 'Watched' : 'Mark watched'}</span>
                  </button>

                  <Link
                    href={`/watch-party?title=${encodeURIComponent(entry.title)}`}
                    className="flex items-center gap-1 rounded-full border border-amber-border bg-amber-dim px-3 py-1.5 text-xs font-medium text-amber-accent hover:bg-amber-accent hover:text-background transition-colors"
                  >
                    <Film className="h-3 w-3" />
                    <span>Party</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

