'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WatchPartyPreviewCard } from '@/components/watch-party/preview/WatchPartyPreviewCard';
import { JoinDialog } from '@/components/watch-party/JoinDialog';
import { safeStorage, RecentParty } from '@/lib/storage';
import { FIXTURE_MOVIES } from '@/data/fixtures';
import { Sparkles, ArrowRight, Play, Users, Clock, History } from 'lucide-react';
import { AvatarId } from '@shared/types';

export default function WatchPartyLandingPage() {
  const router = useRouter();
  const [partyTitle, setPartyTitle] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [recentParties, setRecentParties] = useState<RecentParty[]>([]);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [activeJoinCode, setActiveJoinCode] = useState<string>('');
  const [activeJoinTitle, setActiveJoinTitle] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Check URL hash for #join=<code>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.startsWith('#join=')) {
      const code = hash.replace('#join=', '').trim();
      if (code) {
        setActiveJoinCode(code);
        setActiveJoinTitle('Movie night');
        setJoinModalOpen(true);
      }
    }
    // Load recent parties
    setRecentParties(safeStorage.getRecentParties());
  }, []);

  const handleTitleChange = (val: string) => {
    setPartyTitle(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const matches = FIXTURE_MOVIES.filter((m) =>
      m.title.toLowerCase().includes(val.toLowerCase())
    )
      .slice(0, 4)
      .map((m) => m.title);
    setSuggestions(matches);
  };

  const generateRoomCode = () => {
    // Generate 12-char secure random room code (e.g. CIN-7X9K-4M2P)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CIN-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleStartParty = (e: React.FormEvent) => {
    e.preventDefault();
    const code = generateRoomCode();
    const finalTitle = partyTitle.trim() || 'Movie night';
    setActiveJoinCode(code);
    setActiveJoinTitle(finalTitle);
    setJoinModalOpen(true);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) return;

    let code = joinInput.trim();
    // Support pasting full URL
    if (code.includes('#join=')) {
      code = code.split('#join=')[1];
    } else if (code.includes('/watch-party/')) {
      code = code.split('/watch-party/')[1];
    }

    code = code.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    setActiveJoinCode(code);
    setActiveJoinTitle('Movie night');
    setJoinModalOpen(true);
  };

  const handleConfirmJoin = (name: string, avatar: AvatarId, agreed18Plus: boolean, movieModeMic: boolean) => {
    safeStorage.saveUserPrefs({ name, avatar, agreed18Plus, movieModeMic });
    safeStorage.addRecentParty({
      code: activeJoinCode,
      title: activeJoinTitle,
      joinedAt: Date.now(),
    });
    setJoinModalOpen(false);
    router.push(`/watch-party/${activeJoinCode}`);
  };

  const formatRelativeTime = (ts: number) => {
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)} days ago`;
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb + Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-200">Watch Party</span>
          <span className="ml-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Watch Party · Free
          </span>
        </div>

        {/* Hero Grid: Form on Left, Live Preview Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Party Creation / Join Card */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Watch together,
              <span className="text-amber-accent block mt-1">miles apart.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 font-sans leading-relaxed text-pretty">
              Start an online watch party with friends on Netflix, Prime Video, JioHotstar, YouTube or your own files. See each other&apos;s faces, react, chat, and press play at the same second.
            </p>

            {/* Party Start Card */}
            <div className="rounded-2xl border border-border-hairline bg-surface-card p-6 shadow-2xl relative">
              <form onSubmit={handleStartParty} className="space-y-4">
                <div className="relative">
                  <label htmlFor="watching-input" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    What are you watching? (optional)
                  </label>
                  <input
                    id="watching-input"
                    type="text"
                    value={partyTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Until Dawn, Inception, Dune: Part Two..."
                    className="w-full rounded-xl border border-border-hairline bg-surface-elevated px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
                  />

                  {/* Autocomplete Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-border-hairline bg-surface-elevated p-1 shadow-2xl">
                      {suggestions.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => {
                            setPartyTitle(title);
                            setSuggestions([]);
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-amber-dim hover:text-amber-accent transition-colors"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-amber-accent py-3.5 px-6 text-sm font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
                >
                  <Play className="h-4 w-4 fill-background" />
                  <span>Start a watch party</span>
                </button>

                <p className="text-center text-[11px] text-zinc-400">
                  Free · no sign-up · no extension · best with up to 8 people
                </p>
              </form>

              {/* Join Existing Party Row */}
              <div className="mt-6 pt-6 border-t border-border-hairline">
                <form onSubmit={handleJoinSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="Got a link? Paste it or the party code"
                    className="flex-1 rounded-xl border border-border-hairline bg-surface-elevated px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-amber-border bg-amber-dim px-5 py-2.5 text-xs font-semibold text-amber-accent hover:bg-amber-accent hover:text-background transition-colors"
                  >
                    Join
                  </button>
                </form>
              </div>

              {/* Rejoin Recent Parties (from localStorage) */}
              {recentParties.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border-hairline">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-2.5">
                    <History className="h-3.5 w-3.5 text-amber-accent" />
                    <span>Rejoin a recent party</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentParties.map((p) => (
                      <Link
                        key={p.code}
                        href={`/watch-party/${p.code}`}
                        className="flex items-center gap-1.5 rounded-full border border-border-hairline bg-surface-elevated px-3 py-1 text-[11px] text-zinc-300 hover:border-amber-border hover:text-amber-accent transition-colors"
                      >
                        <span className="font-medium text-white">{p.title}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-zinc-400">{formatRelativeTime(p.joinedAt)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Animated Live Preview Tile */}
          <div className="lg:col-span-5 flex justify-center">
            <WatchPartyPreviewCard />
          </div>
        </div>
      </div>

      {/* Join Dialog Modal */}
      {joinModalOpen && (
        <JoinDialog
          partyTitle={activeJoinTitle}
          roomCode={activeJoinCode}
          onJoin={handleConfirmJoin}
          onCancel={() => setJoinModalOpen(false)}
        />
      )}
    </div>
  );
}

