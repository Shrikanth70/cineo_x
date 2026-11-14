'use client';

import React, { useState, useEffect } from 'react';
import { CountdownState } from '@shared/types';
import { NtpClockSync } from '@/lib/ntp-sync';

export interface CountdownOverlayProps {
  countdown: CountdownState | null;
  ntp: NtpClockSync;
}

export function CountdownOverlay({ countdown, ntp }: CountdownOverlayProps) {
  const [displayNumber, setDisplayNumber] = useState<number | 'Play!' | null>(null);

  useEffect(() => {
    if (!countdown || !countdown.active) {
      setDisplayNumber(null);
      return;
    }

    const interval = setInterval(() => {
      const serverNow = ntp.getEstimatedServerTime();
      const remainingMs = countdown.targetTs - serverNow;

      if (remainingMs <= -800) {
        setDisplayNumber(null);
      } else if (remainingMs <= 0) {
        setDisplayNumber('Play!');
      } else {
        setDisplayNumber(Math.ceil(remainingMs / 1000));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [countdown, ntp]);

  if (displayNumber === null) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
    >
      <div className="flex flex-col items-center">
        <div className="font-serif text-7xl sm:text-9xl font-bold tracking-tighter text-amber-accent drop-shadow-[0_0_35px_rgba(245,194,107,0.7)] animate-bounce">
          {displayNumber}
        </div>
        <p className="mt-4 font-sans text-xs uppercase tracking-widest text-zinc-300">
          Synchronized Party Start
        </p>
      </div>
    </div>
  );
}

