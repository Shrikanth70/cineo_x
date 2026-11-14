import { describe, it, expect, beforeEach } from 'vitest';
import { safeStorage } from '@/lib/storage';

describe('ThreeCinematicHero Storage & Motion State', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (global as any).window = global;
    (global as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };
  });

  it('defaults pause motion to false when unconfigured', () => {
    expect(safeStorage.getPauseMotion()).toBe(false);
  });

  it('updates and persists pause motion when toggled', () => {
    safeStorage.setPauseMotion(true);
    expect(safeStorage.getPauseMotion()).toBe(true);

    safeStorage.setPauseMotion(false);
    expect(safeStorage.getPauseMotion()).toBe(false);
  });
});

