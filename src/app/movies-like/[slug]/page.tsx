import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { tmdb } from '@/lib/tmdb';
import { Star, Flame, Clock, Award, Sparkles, Film } from 'lucide-react';

export default async function MoviesLikeDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug || '101-until-dawn';
  const data = await tmdb.getSimilar(slug);
  const { seedMovie, highestRatedPick, newestPick, rankedMatches } = data;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/movies-like" className="hover:text-white transition-colors">
            Movies Like
          </Link>
          <span>/</span>
          <span className="text-zinc-200">{seedMovie.title}</span>
        </div>

        {/* Hero Section: H1 + Intro Paragraph with Seed Poster at Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center rounded-2xl border border-border-hairline bg-surface-card p-6 sm:p-8 shadow-2xl">
          <div className="md:col-span-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3 py-1 text-xs font-semibold text-amber-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Similarity Dossier</span>
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Movies like <span className="text-amber-accent italic">{seedMovie.title}</span> ({seedMovie.releaseYear})
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 font-sans leading-relaxed text-pretty">
              If you loved the intense mountain claustrophobia, branching survival decisions and atmospheric dread of {seedMovie.title}, these hand-curated companion films deliver parallel psychological high-wire tension and unforgettable cinematic execution.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1 text-amber-accent font-semibold">
                <Star className="h-3.5 w-3.5 fill-amber-accent" />
                {seedMovie.voteAverage.toFixed(1)} Rating
              </span>
              <span>•</span>
              <span>{seedMovie.runtimeMinutes} min</span>
              <span>•</span>
              <span>{seedMovie.genres.join(', ')}</span>
              <span>•</span>
              <Link
                href={`/watch-party?title=${encodeURIComponent(seedMovie.title)}`}
                className="inline-flex items-center gap-1 rounded-full bg-amber-accent px-3 py-1 text-xs font-semibold text-background hover:bg-amber-hover transition-colors"
              >
                <Film className="h-3 w-3" />
                <span>Host Watch Party</span>
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div className="relative aspect-[2/3] w-48 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={seedMovie.posterUrl}
                alt={seedMovie.title}
                fill
                priority
                sizes="192px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Quick Picks Tiles: Highest Rated & Newest */}
        <div>
          <h2 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 mb-3">
            Quick Picks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Highest Rated Pick */}
            <div className="rounded-xl border border-amber-border/40 bg-gradient-to-r from-amber-dim to-surface-card p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-accent text-background font-bold shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-accent">
                  Highest Rated Match
                </span>
                <h3 className="font-semibold text-sm text-white truncate">
                  {highestRatedPick.title} ({highestRatedPick.releaseYear})
                </h3>
                <span className="text-xs text-zinc-400">
                  Rating: ★ {highestRatedPick.voteAverage.toFixed(1)} / 10
                </span>
              </div>
            </div>

            {/* Newest Pick */}
            <div className="rounded-xl border border-border-hairline bg-surface-card p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-zinc-300 font-bold shrink-0 border border-white/10">
                <Flame className="h-6 w-6 text-amber-accent" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Newest Release
                </span>
                <h3 className="font-semibold text-sm text-white truncate">
                  {newestPick.title} ({newestPick.releaseYear})
                </h3>
                <span className="text-xs text-zinc-400">
                  Released {newestPick.releaseYear} • {newestPick.genres.slice(0, 2).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Numbered Ranked List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-zinc-400">
            Top Ranked Matches
          </h2>

          <div className="space-y-3">
            {rankedMatches.map((m, index) => (
              <div
                key={m.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border-hairline bg-surface-card p-4 hover:border-amber-border hover:bg-surface-elevated transition-colors shadow-sm"
              >
                {/* Rank Number */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated font-serif font-bold text-amber-accent text-sm shrink-0 border border-white/5">
                  #{index + 1}
                </div>

                {/* Poster Thumbnail */}
                <div className="relative h-20 w-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <Image
                    src={m.posterUrl}
                    alt={m.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>

                {/* Movie Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sans text-base font-semibold text-white group-hover:text-amber-accent transition-colors">
                      {m.title} ({m.releaseYear})
                    </h3>
                    <div className="flex items-center gap-1 rounded bg-amber-dim px-2 py-0.5 text-[10px] font-semibold text-amber-accent">
                      <Star className="h-3 w-3 fill-amber-accent" />
                      <span>{m.voteAverage.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-1">{m.overview}</p>

                  {/* "Why it matches" line */}
                  <div className="rounded bg-surface px-2.5 py-1 text-[11px] text-zinc-300 border border-border-hairline/60">
                    <strong className="text-amber-accent font-medium">Why it matches: </strong>
                    {m.whyItMatches || 'Parallel themes and storytelling structure.'}
                  </div>
                </div>

                {/* Tags & Action */}
                <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0">
                  <Link
                    href={`/watch-party?title=${encodeURIComponent(m.title)}`}
                    className="flex items-center gap-1.5 rounded-full border border-amber-border bg-amber-dim px-3 py-1.5 text-xs font-medium text-amber-accent hover:bg-amber-accent hover:text-background transition-colors"
                  >
                    <Film className="h-3 w-3" />
                    <span>Watch Party</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

