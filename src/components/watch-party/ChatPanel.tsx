'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AVATARS } from '@shared/types';
import { Send, Flag, ShieldAlert, X } from 'lucide-react';

export interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function ChatPanel({ messages, onSendMessage, isOpen, onClose }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [reportedMessageId, setReportedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleReport = (id: string) => {
    setReportedMessageId(id);
    setTimeout(() => setReportedMessageId(null), 3000);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`;
  };

  return (
    <aside
      aria-label="Party Chat"
      className={`flex flex-col h-full bg-surface-card border-l border-border-hairline transition-all duration-300 ${
        isOpen ? 'w-full md:w-80 lg:w-96' : 'hidden md:flex md:w-80 lg:w-96'
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border-hairline px-4 py-3 bg-surface-elevated">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-white uppercase tracking-wider">Party Chat</span>
          <span className="rounded-full bg-white/10 px-2 py-0.2 text-[10px] text-zinc-400 font-mono">
            {messages.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close Chat"
            className="md:hidden text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-700"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 text-xs px-4">
            <span className="text-3xl mb-2">🍿</span>
            <p className="font-semibold text-zinc-400">Welcome to the room!</p>
            <p className="mt-1">Say hello, react with emojis, or share what you are watching.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id}
                  className="rounded-lg bg-surface-elevated/60 px-3 py-1.5 text-center text-[11px] text-zinc-400 font-mono"
                >
                  {msg.text}
                </div>
              );
            }

            const avatarMeta = AVATARS[msg.senderAvatar] || AVATARS.popcorn;
            const isReported = reportedMessageId === msg.id;

            return (
              <div key={msg.id} className="group flex items-start gap-2.5 text-xs">
                <span className="text-lg leading-none select-none">{avatarMeta.emoji}</span>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{msg.senderName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <span>{formatTimestamp(msg.timestamp)}</span>
                      <button
                        onClick={() => handleReport(msg.id)}
                        title="Report inappropriate message"
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-opacity"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-zinc-300 break-words leading-relaxed">{msg.text}</p>
                  {isReported && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                      <ShieldAlert className="h-3 w-3" />
                      <span>Report received by room moderator.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="border-t border-border-hairline p-3 bg-surface-elevated">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            maxLength={500}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (500 max)..."
            className="w-full rounded-xl border border-border-hairline bg-surface px-3.5 py-2.5 pr-10 text-xs text-white placeholder-zinc-500 focus:border-amber-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 text-amber-accent hover:text-amber-hover disabled:text-zinc-600 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}

