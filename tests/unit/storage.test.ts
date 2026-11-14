import { describe, it, expect, beforeEach } from 'vitest';
import { safeStorage } from '../../src/lib/storage';

describe('SafeStorage LocalStorage Wrapper', () => {
  beforeEach(() => {
    // Mock basic localStorage in Node environment
    const store = new Map<string, string>();
    const storageMock = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      length: 0,
      key: () => null,
    };
    (global as any).window = global;
    (global as any).localStorage = storageMock;
  });

  it('stores and retrieves recent party rooms', () => {
    safeStorage.addRecentParty({
      code: 'CIN-TEST-0001',
      title: 'Friday Movie Night',
      joinedAt: Date.now(),
    });

    const recents = safeStorage.getRecentParties();
    expect(recents.length).toBe(1);
    expect(recents[0].code).toBe('CIN-TEST-0001');
    expect(recents[0].title).toBe('Friday Movie Night');
  });

  it('toggles bookmarks reliably', () => {
    const isNowBookmarked = safeStorage.toggleBookmark(101);
    expect(isNowBookmarked).toBe(true);
    expect(safeStorage.getBookmarks()).toContain(101);

    const isRemoved = safeStorage.toggleBookmark(101);
    expect(isRemoved).toBe(false);
    expect(safeStorage.getBookmarks()).not.toContain(101);
  });
});
