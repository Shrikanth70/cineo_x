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
      // If everyone is ready, start synchronized countdown!
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-hairline bg-surface-card/95 backdrop-blur px-4 py-3 shadow-lg">
      {/* Left: Play/Pause for everyone & Skip 10s */}
      <div className="flex items-center gap-2">
        {isHost ? (
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-2 rounded-full bg-amber-accent px-4 py-2 text-xs font-semibold text-background hover:bg-amber-hover transition-colors shadow-glow"
          >
            {player.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{player.playing ? 'Pause for everyone' : 'Play for everyone'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-elevated px-4 py-2 text-xs font-medium text-zinc-300">
            <span
              className={`h-2 w-2 rounded-full ${
                player.playing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-accent'
              }`}
            />
            <span>{player.playing ? 'Playing (Host sync)' : 'Paused by Host'}</span>
          </div>
        )}

        {isHost && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSkipBack}
              title="Skip back 10 seconds"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-hairline bg-surface-elevated text-zinc-300 hover:text-white hover:bg-surface-highlight transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSkipForward}
              title="Skip forward 10 seconds"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-hairline bg-surface-elevated text-zinc-300 hover:text-white hover:bg-surface-highlight transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Position / Time Display */}
        <div className="ml-2 font-mono text-xs text-zinc-400">
          <span>{formatTime(player.position)}</span>
        </div>
      </div>

      {/* Right: I'm Ready Chip & Break Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Live I'm Ready Chip */}
        <button
          onClick={onToggleReady}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            isReady
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-surface-elevated text-zinc-400 border border-border-hairline hover:text-white'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>I&apos;m ready</span>
          <span className="font-semibold ml-0.5">
            {readyCount}/{totalCount}
          </span>
        </button>

        {/* Break Dropdown (Host initiates) */}
        {isHost && (
          <div className="relative">
            <button
              onClick={() => setBreakMenuOpen(!breakMenuOpen)}
              className="flex items-center gap-1.5 rounded-full border border-border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <Coffee className="h-3.5 w-3.5 text-amber-accent" />
              <span>Break</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {breakMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-36 rounded-xl border border-border-hairline bg-surface-elevated p-1 shadow-2xl z-30">
                <button
                  onClick={() => {
                    onStartBreak(2);
                    setBreakMenuOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  2-Minute Break
                </button>
                <button
                  onClick={() => {
                    onStartBreak(5);
                    setBreakMenuOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  5-Minute Break
                </button>
                <button
                  onClick={() => {
                    onStartBreak(10);
                    setBreakMenuOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  10-Minute Break
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

