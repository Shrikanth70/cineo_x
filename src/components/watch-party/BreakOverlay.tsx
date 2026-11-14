'use client';

import React, { useState, useEffect } from 'react';
import { BreakState } from '@shared/types';
import { NtpClockSync } from '@/lib/ntp-sync';
import { Coffee, Play } from 'lucide-react';

export interface BreakOverlayProps {
  breakState: BreakState | null;
  ntp: NtpClockSync;
  isHost: boolean;
  onEndBreak: () => void;
}

export function BreakOverlay({ breakState, ntp, isHost, onEndBreak }: BreakOverlayProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!breakState || !breakState.active) {
      setSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const serverNow = ntp.getEstimatedServerTime();
      const remaining = Math.max(0, Math.ceil((breakState.endsAtTs - serverNow) / 1000));
      setSecondsRemaining(remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [breakState, ntp]);

  if (!breakState || !breakState.active) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
    >
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-dim text-amber-accent mb-4 border border-amber-border">
          <Coffee className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-white">Party Break Time</h3>
        <p className="mt-1 text-xs text-zinc-400">Everyone paused to grab drinks or snacks.</p>

        <div className="my-6 rounded-2xl border border-white/10 bg-surface-elevated px-6 py-4">
          <span className="font-mono text-4xl sm:text-5xl font-bold text-amber-accent">
            {timeFormatted}
          </span>
        </div>

        {isHost && (
          <button
            onClick={onEndBreak}
            className="flex items-center gap-2 rounded-full bg-amber-accent px-5 py-2.5 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            <Play className="h-4 w-4" />
            <span>End Break & Resume</span>
          </button>
        )}
      </div>
    </div>
  );
}

