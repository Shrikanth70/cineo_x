'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AvatarId, AVATARS } from '@shared/types';
import { safeStorage } from '@/lib/storage';
import { Sparkles, ShieldCheck, Mic } from 'lucide-react';

export interface JoinDialogProps {
  partyTitle: string;
  roomCode: string;
  onJoin: (name: string, avatar: AvatarId, agreed18Plus: boolean, movieModeMic: boolean) => void;
  onCancel?: () => void;
}

export function JoinDialog({ partyTitle, roomCode, onJoin, onCancel }: JoinDialogProps) {
  const initialPrefs = safeStorage.getUserPrefs();
  const [name, setName] = useState(initialPrefs.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(initialPrefs.avatar || 'popcorn');
  const [movieModeMic, setMovieModeMic] = useState(initialPrefs.movieModeMic || false);
  const [agreed18Plus, setAgreed18Plus] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const avatarList = Object.values(AVATARS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Please enter your name.');
      return;
    }
    if (!agreed18Plus) {
      setValidationError('You must confirm that you are 18+ or have parental permission.');
      return;
    }
    setValidationError(null);
    onJoin(name.trim(), selectedAvatar, agreed18Plus, movieModeMic);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border-hairline bg-surface-card p-6 sm:p-8 shadow-2xl">
        {/* Eyebrow & Title */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3 py-1 text-xs font-semibold text-amber-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>You&apos;re joining a watch party</span>
          </span>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {partyTitle || 'Movie night'}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">Room Code: <span className="font-mono text-zinc-300 font-semibold">{roomCode}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Your Name Input */}
          <div>
            <label htmlFor="join-name" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              id="join-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full rounded-xl border border-border-hairline bg-surface-elevated px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
            />
          </div>

          {/* Pick a Face (12 Emoji Avatars) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Pick a Face
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {avatarList.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    aria-label={avatar.label}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-2xl transition-all ${
                      isSelected
                        ? 'border-2 border-amber-accent bg-amber-dim scale-105 shadow-glow'
                        : 'border border-border-hairline bg-surface-elevated hover:bg-surface-highlight hover:border-zinc-500'
                    }`}
                  >
                    <span>{avatar.emoji}</span>
                    <span className="mt-1 text-[10px] text-zinc-400 capitalize">{avatar.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checkbox: Movie-mode mic */}
          <div className="rounded-xl border border-border-hairline bg-surface-elevated p-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={movieModeMic}
                onChange={(e) => setMovieModeMic(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-surface text-amber-accent focus:ring-amber-accent"
              />
              <div className="text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-amber-accent" />
                  Movie-mode mic
                </span>
                <p className="mt-0.5 text-zinc-400 text-[11px] leading-relaxed">
                  Automatically muted while the film plays; hold <kbd className="rounded bg-black/60 px-1 py-0.5 font-mono text-[10px] text-zinc-300">Space</kbd> or the mic button to talk.
                </p>
              </div>
            </label>
          </div>

          {/* Checkbox: 18+ / Parental Permission Agreement */}
          <div className="rounded-xl border border-border-hairline bg-surface-elevated p-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreed18Plus}
                onChange={(e) => setAgreed18Plus(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-surface text-amber-accent focus:ring-amber-accent"
              />
              <div className="text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  18+ / Parental Permission Agreement
                </span>
                <p className="mt-0.5 text-zinc-400 text-[11px] leading-relaxed">
                  I agree to the{' '}
                  <Link href="/rules" target="_blank" className="text-amber-accent underline hover:text-amber-hover">
                    Watch Party Rules
                  </Link>{' '}
                  (strictly no abusive, sexual, hateful or illegal content).
                </p>
              </div>
            </label>
          </div>

          {validationError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              {validationError}
            </div>
          )}

          {/* Buttons: Amber Join Party & Text Not Now */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!agreed18Plus || !name.trim()}
              className="w-full sm:flex-1 rounded-full bg-amber-accent py-3 px-6 text-sm font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-accent"
            >
              Join the party
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-3 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Not now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

