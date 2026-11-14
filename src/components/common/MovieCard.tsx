'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/types/movie';
import { Star, Bookmark, Film } from 'lucide-react';
import { safeStorage } from '@/lib/storage';

export interface MovieCardProps {
  movie: Movie;
  showRank?: number;
}

export function MovieCard({ movie, showRank }: MovieCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = safeStorage.toggleBookmark(movie.id);
    setIsBookmarked(next);
  };

  const slug = `${movie.id}-${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="group relative flex flex-col rounded-card border border-border-hairline bg-surface-card overflow-hidden shadow-card hover:border-amber-border hover:shadow-glow transition-all duration-300">
      {/* Poster Image Container */}
      <Link href={`/movies-like/${slug}`} className="relative aspect-[2/3] w-full overflow-hidden bg-surface-elevated">
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Rank Number if supplied */}
        {typeof showRank === 'number' && (
          <div className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/80 font-serif font-bold text-amber-accent text-sm border border-white/10 backdrop-blur">
            #{showRank}
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/80 backdrop-blur px-2 py-0.5 text-[11px] font-semibold text-amber-accent border border-white/10">
          <Star className="h-3 w-3 fill-amber-accent" />
          <span>{movie.voteAverage.toFixed(1)}</span>
        </div>

        {/* Bookmark Quick Action Button */}
        <button
          onClick={handleToggleBookmark}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark movie'}
          className={`absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all ${
            isBookmarked
              ? 'bg-amber-accent text-background'
              : 'bg-black/70 text-zinc-300 hover:text-white hover:bg-black/90'
          }`}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </Link>

      {/* Info Meta */}
      <div className="flex flex-1 flex-col p-3.5 justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span>{movie.releaseYear}</span>
            <span>•</span>
            <span>{movie.runtimeMinutes}m</span>
            {movie.certification && (
              <>
                <span>•</span>
                <span className="rounded border border-white/10 px-1 py-0.2 text-[9px]">
                  {movie.certification}
                </span>
              </>
            )}
          </div>

          <h3 className="mt-1 font-sans text-sm font-semibold text-white line-clamp-1 group-hover:text-amber-accent transition-colors">
            <Link href={`/movies-like/${slug}`}>{movie.title}</Link>
          </h3>
        </div>

        {/* Genres & Watch Party Direct Launch */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-hairline/60">
          <span className="text-[11px] text-zinc-400 line-clamp-1">
            {movie.genres.slice(0, 2).join(' / ')}
          </span>
          <Link
            href={`/watch-party?title=${encodeURIComponent(movie.title)}`}
            title={`Watch Party for ${movie.title}`}
            className="flex items-center gap-1 text-[11px] font-medium text-amber-accent hover:text-amber-hover"
          >
            <Film className="h-3 w-3" />
            <span className="hidden sm:inline">Party</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

