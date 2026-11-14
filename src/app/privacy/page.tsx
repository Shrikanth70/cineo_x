import React from 'react';
import Link from 'next/link';
import { BRAND_NAME } from '@/config/brand';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3 py-1 text-xs font-semibold text-amber-accent">
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {BRAND_NAME} Privacy Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            We believe in radical data minimization: your camera, microphone, and personal watch history belong solely to you.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <section className="rounded-2xl border border-border-hairline bg-surface-card p-6 space-y-2">
            <h2 className="font-serif text-lg font-bold text-white">1. No Camera or Microphone Recording</h2>
            <p className="text-zinc-400">
              Video and audio streams are exchanged directly peer-to-peer over encrypted WebRTC mesh. {BRAND_NAME} servers never record, process, store or intercept your voice or camera feed.
            </p>
          </section>

          <section className="rounded-2xl border border-border-hairline bg-surface-card p-6 space-y-2">
            <h2 className="font-serif text-lg font-bold text-white">2. Ephemeral Room State</h2>
            <p className="text-zinc-400">
              Watch party rooms, chat messages and reactions exist purely in server memory for the duration of the party session. When all participants leave, the room is permanently erased from memory.
            </p>
          </section>

          <section className="rounded-2xl border border-border-hairline bg-surface-card p-6 space-y-2">
            <h2 className="font-serif text-lg font-bold text-white">3. Local-First Storage</h2>
            <p className="text-zinc-400">
              Your bookmarks, recent parties list, and UI preferences (such as avatar choices and motion pause) are stored entirely in your browser&apos;s localStorage and are never tracked across domains.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

