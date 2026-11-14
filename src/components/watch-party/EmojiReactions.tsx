'use client';

import React from 'react';
import { FloatingReaction } from '@shared/types';

export const REACTION_EMOJIS = ['😂', '😱', '😍', '🔥', '❤️', '👏', '🤠', '💀'] as const;

export interface EmojiReactionsProps {
  reactions: FloatingReaction[];
  onSendReaction: (emoji: string) => void;
}

export function EmojiReactions({ reactions, onSendReaction }: EmojiReactionsProps) {
  return (
    <>
      {/* Floating Animated Emojis in Room */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
        {reactions.map((rx, idx) => {
          // Generate deterministic horizontal spread
          const leftPercent = 20 + ((rx.timestamp + idx * 17) % 60);
          return (
            <div
              key={rx.id}
              className="absolute bottom-16 text-3xl sm:text-4xl animate-float-emoji filter drop-shadow-lg"
              style={{ left: `${leftPercent}%` }}
            >
              {rx.emoji}
            </div>
          );
        })}
      </div>

      {/* Tap Bar of Reaction Emojis */}
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border-hairline bg-surface/90 backdrop-blur-md px-2.5 py-1.5 shadow-lg">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction(emoji)}
            aria-label={`React with ${emoji}`}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-base sm:text-lg hover:scale-125 hover:bg-white/10 active:scale-95 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

