'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Users } from 'lucide-react';

export function WatchPartyPreviewCard() {
  const [countdownStep, setCountdownStep] = useState<number | string>(3);
  const [emojis, setEmojis] = useState<{ id: number; symbol: string; left: number }[]>([]);

  // Simulation of the 3-2-1-Play countdown loop for the preview tile
  useEffect(() => {
    const steps: (number | string)[] = [3, 2, 1, 'Play!'];
    let idx = 0;

    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setCountdownStep(steps[idx]);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Floating emoji generator for preview
  useEffect(() => {
    const symbols = ['🍿', '🔥', '😂', '❤️', '😱'];
    const emojiInterval = setInterval(() => {
      const newEmoji = {
        id: Date.now() + Math.random(),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        left: 20 + Math.random() * 60,
      };
      setEmojis((prev) => [...prev.slice(-6), newEmoji]);
    }, 1200);

    return () => clearInterval(emojiInterval);
  }, []);

  return (
    <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-amber-border/40 bg-gradient-to-br from-surface-card via-surface-elevated to-cinematic-blue/40 p-5 shadow-2xl">
      {/* Background preview poster */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
          alt="Watch party preview background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Floating Emojis in Preview */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {emojis.map((e) => (
          <div
            key={e.id}
            className="absolute bottom-12 text-2xl sm:text-3xl animate-float-emoji"
            style={{ left: `${e.left}%` }}
          >
            {e.symbol}
          </div>
        ))}
      </div>

      {/* Synchronized 3-2-1-Play Center Badge */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 border border-amber-border backdrop-blur-md shadow-glow">
          <span className="font-serif text-3xl font-bold text-amber-accent animate-pulse">
            {countdownStep}
          </span>
        </div>
        <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-accent" />
          Synchronized Instant Play
        </span>
      </div>

      {/* Bottom Simulated Face Tiles */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-xl bg-black/70 backdrop-blur px-3 py-2 border border-white/10">
        <div className="flex items-center -space-x-2">
          {['🍿', '🎬', '🦄', '🐼'].map((emoji, i) => (
            <div
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated border-2 border-surface-card text-base shadow"
            >
              {emoji}
            </div>
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-accent text-background text-[11px] font-bold border-2 border-surface-card shadow">
            +4
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <Users className="h-3.5 w-3.5" />
          <span>Synced 8/8</span>
        </div>
      </div>
    </div>
  );
}

