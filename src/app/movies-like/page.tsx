'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, TrendingUp, Compass } from 'lucide-react';
import { FIXTURE_MOVIES } from '@/data/fixtures';

export default function MoviesLikeIndexPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTitle.trim()) return;
    const match = FIXTURE_MOVIES.find((m) =>
      m.title.toLowerCase().includes(searchTitle.toLowerCase())
    );
    if (match) {
      const slug = `${match.id}-${match.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      router.push(`/movies-like/${slug}`);
    } else {
      router.push(`/movies-like/101-until-dawn`);
    }
  };

  const trendingThisWeek = [
    { title: 'Until Dawn (2025)', slug: '101-until-dawn' },
    { title: 'Inception (2010)', slug: '103-inception' },
    { title: 'Interstellar (2014)', slug: '104-interstellar' },
    { title: 'Dune: Part Two (2024)', slug: '105-dune-part-two' },
    { title: 'The Cabin in the Woods (2012)', slug: '102-the-cabin-in-the-woods' },
    { title: 'Blade Runner 2049 (2017)', slug: '106-blade-runner-2049' },
  ];

  const popularSearches = [
    { title: 'Movies like Shutter Island', slug: '107-shutter-island' },
    { title: 'Movies like The Thing (1982)', slug: '112-the-thing' },
    { title: 'Movies like Talk to Me (2023)', slug: '114-talk-to-me' },
    { title: 'Movies like Midsommar (2019)', slug: '113-midsommar' },
    { title: 'Movies like RRR (2022)', slug: '108-rrr' },
    { title: 'Movies like Manjummel Boys (2024)', slug: '111-manjummel-boys' },
  ];

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3.5 py-1 text-xs font-semibold text-amber-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Similarity Engine</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            Find movies like...
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-300 font-sans leading-relaxed">
            Enter any favorite movie to explore ranked thematic matches, narrative parallels, directing signatures and psychological tropes.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center rounded-full border border-border-hairline bg-surface-card p-1.5 shadow-lg focus-within:border-amber-accent">
              <Search className="h-5 w-5 text-zinc-400 ml-3" />
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Search a title (e.g. Inception, Until Dawn, Dune)..."
                className="flex-1 bg-transparent px-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-amber-accent px-5 py-2.5 text-xs font-semibold text-background hover:bg-amber-hover transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Two 3-column link lists: Trending this week and Popular searches */}
        <div className="space-y-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-amber-accent" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-white">
                Trending This Week
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {trendingThisWeek.map((item) => (
                <Link
                  key={item.slug}
                  href={`/movies-like/${item.slug}`}
                  className="rounded-xl border border-border-hairline bg-surface-card p-4 hover:border-amber-border hover:bg-surface-elevated transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-amber-accent">
                    Movies like {item.title}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-4 w-4 text-amber-accent" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-white">
                Popular Searches
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {popularSearches.map((item) => (
                <Link
                  key={item.slug}
                  href={`/movies-like/${item.slug}`}
                  className="rounded-xl border border-border-hairline bg-surface-card p-4 hover:border-amber-border hover:bg-surface-elevated transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-amber-accent">
                    {item.title}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

