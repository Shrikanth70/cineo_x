'use client';

import React, { useState } from 'react';
import { PlayerState, Participant } from '@shared/types';
import { Play, Pause, RotateCcw, RotateCw, CheckCircle2, Coffee, ChevronDown } from 'lucide-react';

export interface PlayerBarProps {
  player: PlayerState;
  participants: Participant[];
  isHost: boolean;
  isReady: boolean;
  onPlay: (position: number) => void;
  onPause: (position: number) => void;
  onSeek: (position: number) => void;
  onToggleReady: () => void;
  onStartBreak: (durationMinutes: number) => void;
  onStartCountdown: (seconds: number) => void;
}

export function PlayerBar({
  player,
  participants,
  isHost,
  isReady,
  onPlay,
  onPause,
  onSeek,
  onToggleReady,
  onStartBreak,
  onStartCountdown,
}: PlayerBarProps) {
  const [breakMenuOpen, setBreakMenuOpen] = useState(false);

  const readyCount = participants.filter((p) => p.isReady).length;
  const totalCount = participants.length;
  const allReady = totalCount > 0 && readyCount === totalCount;

  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayToggle = () => {
    if (!isHost) return;
    if (player.playing) {
      onPause(player.position);
    } else {
      if (allReady && totalCount > 1) {
        onStartCountdown(3);
      } else {
        onPlay(player.position);
      }
    }
  };

  const handleSkipBack = () => {
    if (!isHost) return;
    onSeek(Math.max(0, player.position - 10));
  };

  const handleSkipForward = () => {
    if (!isHost) return;
    onSeek(player.position + 10);
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-surface-card/95 backdrop-blur-md px-3 py-2 text-xs text-zinc-300 shadow-md">
      {/* Left: Play/Pause for everyone & Quick Seek */}
      <div className="flex items-center gap-2">
        {isHost ? (
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-1.5 rounded-lg bg-amber-accent px-3 py-1.5 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            {player.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{player.playing ? 'Pause' : 'Play for party'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-zinc-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                player.playing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-accent'
              }`}
            />
            <span>{player.playing ? 'Playing (Host sync)' : 'Paused by Host'}</span>
          </div>
        )}

        {isHost && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleSkipBack}
              title="Skip back 10s"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-hairline bg-surface-elevated text-zinc-300 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={handleSkipForward}
              title="Skip forward 10s"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-hairline bg-surface-elevated text-zinc-300 hover:text-white transition-colors"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="font-mono text-[11px] text-zinc-400 pl-1">
          <span>{formatTime(player.position)}</span>
        </div>
      </div>

      {/* Right: Ready Indicator & Break Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleReady}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
            isReady
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-surface-elevated text-zinc-400 border border-border-hairline hover:text-white'
          }`}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="hidden sm:inline">I&apos;m ready</span>
          <span className="font-semibold text-[11px]">
            {readyCount}/{totalCount}
          </span>
        </button>

        {isHost && (
          <div className="relative">
            <button
              onClick={() => setBreakMenuOpen(!breakMenuOpen)}
              className="flex items-center gap-1 rounded-lg border border-border-hairline bg-surface-elevated px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <Coffee className="h-3 w-3 text-amber-accent" />
              <span className="hidden sm:inline">Break</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {breakMenuOpen && (
              <div className="absolute right-0 bottom-full mb-1.5 w-32 rounded-xl border border-white/10 bg-surface-elevated p-1 shadow-2xl z-30">
                {[2, 5, 10].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      onStartBreak(mins);
                      setBreakMenuOpen(false);
                    }}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                  >
                    {mins}-Min Break
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
