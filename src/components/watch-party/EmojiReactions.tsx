'use client';

import React from 'react';
import { FloatingReaction } from '@shared/types';

export const REACTION_EMOJIS = ['😂', '😱', '😍', '🔥', '❤️', '👏', '🤠', '💀'] as const;

export interface EmojiReactionsProps {
  reactions: FloatingReaction[];
  onSendReaction?: (emoji: string) => void;
}

export function EmojiReactions({ reactions }: EmojiReactionsProps) {
  return (
    /* Floating Animated Emojis on Video Canvas */
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {reactions.map((rx, idx) => {
        // Deterministic horizontal spread across 15% to 85%
        const leftPercent = 15 + ((rx.timestamp + idx * 17) % 70);
        return (
          <div
            key={rx.id}
            className="absolute bottom-8 text-3xl sm:text-4xl animate-float-emoji filter drop-shadow-lg"
            style={{ left: `${leftPercent}%` }}
          >
            {rx.emoji}
          </div>
        );
      })}
    </div>
  );
}
