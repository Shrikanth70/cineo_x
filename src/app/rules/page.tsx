import React from 'react';
import Link from 'next/link';
import { WATCH_PARTY_RULES, BRAND_NAME } from '@/config/brand';
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/watch-party"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Watch Party</span>
        </Link>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border/40 bg-amber-dim px-3 py-1 text-xs font-semibold text-amber-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Room Code of Conduct</span>
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {BRAND_NAME} Watch Party Rules
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {BRAND_NAME} provides free, private synchronized playback rooms for friends. To preserve a welcoming environment, all participants must abide by these rules.
          </p>
        </div>

        <div className="space-y-4">
          {WATCH_PARTY_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border-hairline bg-surface-card p-5 flex items-start gap-3.5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-accent text-background font-bold text-xs shrink-0">
                {idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <strong className="font-semibold block mb-1">Enforcement & Moderation</strong>
            <span>
              Rooms are private peer groups. Any participant can report inappropriate messages. The host or participants can remove abusive members. Severe violations result in IP ban from the realtime coordinator.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

