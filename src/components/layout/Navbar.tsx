'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND_NAME, MAIN_NAV_ITEMS } from '@/config/brand';
import { Search, Bookmark, SlidersHorizontal, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (pathname?.startsWith('/watch-party/')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border-hairline bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + Wordmark */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-accent to-amber-hover text-background font-serif font-bold text-xl shadow-glow transition-transform group-hover:scale-105">
                C
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-amber-accent transition-colors">
                {BRAND_NAME}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-accent text-background font-semibold shadow-glow'
                        : 'text-zinc-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge === 'Free' && (
                      <span
                        className={`flex h-4 items-center rounded-full px-1.5 text-[9px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-background text-amber-accent'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        Free
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search movies"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-surface hover:bg-surface-elevated text-zinc-300 hover:text-white transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/discover"
              aria-label="Discover catalog"
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-surface hover:bg-surface-elevated text-zinc-300 hover:text-white transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-surface text-zinc-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border-hairline bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-accent text-background font-semibold'
                      : 'text-zinc-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge === 'Free' && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-bold uppercase">
                      Free Room
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Global Quick Search Dialog */}
      {searchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border-hairline bg-surface-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border-hairline pb-4">
              <Search className="h-5 w-5 text-amber-accent" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask anything about any movie, genre or actor..."
                className="w-full bg-transparent text-base text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="pt-4 text-xs text-zinc-400 flex flex-wrap gap-2">
              <span className="font-semibold text-zinc-300">Quick queries:</span>
              <Link
                href="/movies-like/101-until-dawn"
                onClick={() => setSearchModalOpen(false)}
                className="rounded-full bg-white/5 px-2.5 py-1 hover:bg-amber-dim hover:text-amber-accent transition-colors"
              >
                Movies like Until Dawn
              </Link>
              <Link
                href="/movies-like/103-inception"
                onClick={() => setSearchModalOpen(false)}
                className="rounded-full bg-white/5 px-2.5 py-1 hover:bg-amber-dim hover:text-amber-accent transition-colors"
              >
                Movies like Inception
              </Link>
              <Link
                href="/watch-order/lord-of-the-rings"
                onClick={() => setSearchModalOpen(false)}
                className="rounded-full bg-white/5 px-2.5 py-1 hover:bg-amber-dim hover:text-amber-accent transition-colors"
              >
                Lord of the Rings Watch Order
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

