'use client';

import React, { useState, useMemo } from 'react';
import { FIXTURE_MOVIES } from '@/data/fixtures';
import { MovieCard } from '@/components/common/MovieCard';
import { SlidersHorizontal, Search, RotateCcw } from 'lucide-react';

export default function DiscoverPage() {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const genres = ['All', 'Sci-Fi', 'Horror', 'Action', 'Drama', 'Mystery', 'Thriller', 'Adventure'];
  const languages = ['All', 'Telugu', 'Hindi', 'Tamil', 'Malayalam', 'English'];
  const providers = ['All', 'Netflix', 'Prime Video', 'JioHotstar', 'Apple TV+'];
  const years = ['All', '2025', '2024', '2023', '2022', '2010s', 'Classics'];

  const filteredMovies = useMemo(() => {
    return FIXTURE_MOVIES.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchOverview = m.overview.toLowerCase().includes(q);
        if (!matchTitle && !matchOverview) return false;
      }

      if (selectedGenre !== 'All' && !m.genres.includes(selectedGenre)) {
        return false;
      }

      if (selectedLanguage !== 'All' && m.language !== selectedLanguage) {
        return false;
      }

      if (selectedProvider !== 'All' && !m.providers?.stream?.includes(selectedProvider)) {
        return false;
      }

      if (selectedYear !== 'All') {
        if (selectedYear === '2025' && m.releaseYear !== 2025) return false;
        if (selectedYear === '2024' && m.releaseYear !== 2024) return false;
        if (selectedYear === '2023' && m.releaseYear !== 2023) return false;
        if (selectedYear === '2022' && m.releaseYear !== 2022) return false;
        if (selectedYear === '2010s' && (m.releaseYear < 2010 || m.releaseYear > 2019)) return false;
        if (selectedYear === 'Classics' && m.releaseYear >= 2010) return false;
      }

      return true;
    });
  }, [searchQuery, selectedGenre, selectedLanguage, selectedProvider, selectedYear]);

  const handleResetFilters = () => {
    setSelectedGenre('All');
    setSelectedLanguage('All');
    setSelectedProvider('All');
    setSelectedYear('All');
    setSearchQuery('');
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Title & Filter Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-hairline pb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Discover Cinema
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Filter by genre, regional languages (Telugu, Hindi, Tamil, Malayalam), release year and OTT platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 rounded-full border border-border-hairline bg-surface-elevated px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-2xl border border-border-hairline bg-surface-card p-4 shadow-lg">
          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title or keywords..."
                className="w-full rounded-xl border border-border-hairline bg-surface-elevated py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full rounded-xl border border-border-hairline bg-surface-elevated py-2 px-3 text-xs text-white focus:border-amber-accent focus:outline-none"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter (incl. Telugu/Hindi/Tamil/Malayalam/English) */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full rounded-xl border border-border-hairline bg-surface-elevated py-2 px-3 text-xs text-white focus:border-amber-accent focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* OTT Platform Provider */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Streaming On
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full rounded-xl border border-border-hairline bg-surface-elevated py-2 px-3 text-xs text-white focus:border-amber-accent focus:outline-none"
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Release Era
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-xl border border-border-hairline bg-surface-elevated py-2 px-3 text-xs text-white focus:border-amber-accent focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Showing {filteredMovies.length} Title{filteredMovies.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border-hairline bg-surface-card p-12 text-center">
              <SlidersHorizontal className="h-10 w-10 text-zinc-600 mb-3" />
              <h3 className="font-serif text-lg font-bold text-white">No exact matching titles</h3>
              <p className="mt-1 text-xs text-zinc-400">Try broadening your genre, language or platform filters.</p>
              <button
                onClick={handleResetFilters}
                className="mt-4 rounded-full bg-amber-accent px-4 py-2 text-xs font-semibold text-background hover:bg-amber-hover transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMovies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

