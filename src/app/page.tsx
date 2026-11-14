import React from 'react';
import Link from 'next/link';
import { ThreeCinematicHero } from '@/components/home/ThreeCinematicHero';
import { MovieCard } from '@/components/common/MovieCard';
import { tmdb } from '@/lib/tmdb';
import { FIXTURE_MOVIES, FRANCHISES } from '@/data/fixtures';
import { TrendingUp, Film, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const trendingMovies = await tmdb.getTrending();
  const topRatedMovies = await tmdb.getTopRated();

  const horrorPicks = FIXTURE_MOVIES.filter((m) => m.genres.includes('Horror'));
  const regionalPicks = FIXTURE_MOVIES.filter((m) =>
    ['Telugu', 'Kannada', 'Tamil', 'Malayalam'].includes(m.language)
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Three.js Cinematic Hero Section */}
      <ThreeCinematicHero />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 pb-20">
        {/* Trending This Week */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-dim text-amber-accent border border-amber-border/40">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Trending This Week
                </h2>
                <p className="text-xs text-zinc-400">What cinema lovers are watching right now</p>
              </div>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold text-amber-accent hover:text-amber-hover flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingMovies.slice(0, 5).map((m, idx) => (
              <MovieCard key={m.id} movie={m} showRank={idx + 1} />
            ))}
          </div>
        </section>

        {/* Watch Party Callout Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-border/40 bg-gradient-to-r from-amber-dim/60 via-surface-card to-cinematic-blue/40 p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Free • Zero Sign-Up • Zero Extension
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Watch Together, Miles Apart
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Synchronize video with up to 8 friends on Netflix, Prime Video, JioHotstar, YouTube, or your own local files. React with live floating emojis and synchronized 3·2·1·Play countdowns.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/watch-party"
                className="flex items-center gap-2 rounded-full bg-amber-accent px-6 py-3 text-xs sm:text-sm font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
              >
                <Film className="h-4 w-4" />
                <span>Start a Free Watch Party</span>
              </Link>
              <Link
                href="/rules"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Watch Party Safety & Rules</span>
              </Link>
            </div>
          </div>
        </section>

        {/* High-Voltage Cabin & Isolation Thrillers */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Cabin & Sub-Zero Paranoia
              </h2>
              <p className="text-xs text-zinc-400">High-tension isolation horror inspired by Until Dawn</p>
            </div>
            <Link
              href="/movies-like/101-until-dawn"
              className="text-xs font-semibold text-amber-accent hover:text-amber-hover flex items-center gap-1"
            >
              <span>More like Until Dawn</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {horrorPicks.slice(0, 5).map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>

        {/* Regional Masterworks */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Audacious South Asian Cinema
              </h2>
              <p className="text-xs text-zinc-400">Telugu, Tamil, Kannada and Malayalam gamechangers</p>
            </div>
            <Link
              href="/discover?lang=regional"
              className="text-xs font-semibold text-amber-accent hover:text-amber-hover flex items-center gap-1"
            >
              <span>Explore regional</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {regionalPicks.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

