'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FRANCHISES } from '@/data/fixtures';
import { Search, Clapperboard, Sparkles, ArrowRight } from 'lucide-react';

export default function WatchOrderIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFranchises = FRANCHISES.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.entries.some((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3.5 py-1 text-xs font-semibold text-amber-accent">
            <Clapperboard className="h-3.5 w-3.5" />
            <span>Franchise Roadmaps</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            Franchise Watch Orders
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-300 font-sans leading-relaxed">
            Never wonder where to start or which timeline order makes sense. Chronological vs release orders, runtimes, and post-credit alerts.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center rounded-full border border-border-hairline bg-surface-card p-1.5 shadow-lg focus-within:border-amber-accent">
              <Search className="h-5 w-5 text-zinc-400 ml-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a watch order or any film in it..."
                className="flex-1 bg-transparent px-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2-Column Grid of Franchise Cards (with 3-poster strip each) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFranchises.map((f) => (
            <Link
              key={f.id}
              href={`/watch-order/${f.slug}`}
              className="group rounded-2xl border border-border-hairline bg-surface-card overflow-hidden hover:border-amber-border hover:shadow-glow transition-all duration-300 flex flex-col justify-between"
            >
              {/* 3-Poster Strip */}
              <div className="relative grid grid-cols-3 gap-1 p-2 bg-surface-elevated/70">
                {f.posterStrip.slice(0, 3).map((poster, idx) => (
                  <div key={idx} className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/5">
                    <Image
                      src={poster}
                      alt={`${f.title} poster ${idx + 1}`}
                      fill
                      sizes="140px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>

              {/* Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-amber-accent font-semibold">
                      {f.filmsOutCount} films out {f.moreComing && '• more coming'}
                    </span>
                    <span className="text-zinc-500 group-hover:text-amber-accent transition-colors flex items-center gap-1">
                      <span>View timeline</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-amber-accent transition-colors">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

