'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND_NAME, BRAND_CONFIG } from '@/config/brand';

export function Footer() {
  const pathname = usePathname();

  // Hide global marketing footer in live watch party rooms to give 100% viewport space to video & chat
  if (pathname?.startsWith('/watch-party/')) {
    return null;
  }

  return (
    <footer className="border-t border-border-hairline bg-surface/80 text-zinc-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-accent text-background font-serif font-bold text-base">
                C
              </div>
              <span className="font-serif text-lg font-bold text-white">{BRAND_NAME}</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">{BRAND_CONFIG.subtitle}</p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 uppercase tracking-wider mb-3 text-[11px]">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/discover" className="hover:text-amber-accent transition-colors">
                  Movie & Series Discovery
                </Link>
              </li>
              <li>
                <Link href="/movies-like" className="hover:text-amber-accent transition-colors">
                  Movies Like (Recommendation Engine)
                </Link>
              </li>
              <li>
                <Link href="/watch-order" className="hover:text-amber-accent transition-colors">
                  Franchise Watch Order Timelines
                </Link>
              </li>
              <li>
                <Link href="/watch-party" className="text-amber-accent hover:underline font-medium">
                  Watch Party Rooms (Free)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 uppercase tracking-wider mb-3 text-[11px]">Features</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-zinc-300">Synchronized Watch Parties</span>
              </li>
              <li>
                <span className="text-zinc-300">OTT App Sync (Netflix, Prime, Hotstar)</span>
              </li>
              <li>
                <span className="text-zinc-300">YouTube IFrame & Local File Sync</span>
              </li>
              <li>
                <span className="text-zinc-300">Low-Latency WebRTC Video & Audio</span>
              </li>
              <li>
                <span className="text-zinc-300">Sub-second Countdown (NTP Clocks)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 uppercase tracking-wider mb-3 text-[11px]">Safety & Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/rules" className="hover:text-amber-accent transition-colors">
                  Watch Party Rules & Code of Conduct
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="mt-4 rounded-xl border border-border-hairline bg-surface-elevated p-3 text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-300">TMDB Attribution:</span>
              <p className="mt-1">{BRAND_CONFIG.tmdbAttribution}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border-hairline pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>
            &copy; {new Date().getFullYear()} {BRAND_NAME}. Built with zero DRM circumvention or pirated video streaming.
          </p>
          <p className="text-zinc-500">
            Powered by Next.js 14, WebSockets, WebRTC & TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}

