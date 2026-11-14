import { AvatarId } from '@shared/types';

export interface RecentParty {
  code: string;
  title: string;
  joinedAt: number;
}

export interface UserPreferences {
  name: string;
  avatar: AvatarId;
  movieModeMic: boolean;
  agreed18Plus: boolean;
}

const STORAGE_KEYS = {
  RECENT_PARTIES: 'cineo:recent_parties',
  USER_PREFS: 'cineo:user_prefs',
  BOOKMARKS: 'cineo:bookmarks',
  PAUSE_MOTION: 'cineo:pause_motion',
} as const;

export const safeStorage = {
  getRecentParties(): RecentParty[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_PARTIES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }
      return [];
    } catch {
      return [];
    }
  },

  addRecentParty(party: RecentParty): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = safeStorage.getRecentParties();
      const filtered = existing.filter((p) => p.code !== party.code);
      filtered.unshift(party);
      localStorage.setItem(STORAGE_KEYS.RECENT_PARTIES, JSON.stringify(filtered.slice(0, 5)));
    } catch {
      // Ignore quota or disabled localstorage errors
    }
  },

  getUserPrefs(): UserPreferences {
    const fallback: UserPreferences = {
      name: '',
      avatar: 'popcorn',
      movieModeMic: false,
      agreed18Plus: false,
    };
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
      if (!raw) return fallback;
      return { ...fallback, ...JSON.parse(raw) };
    } catch {
      return fallback;
    }
  },

  saveUserPrefs(prefs: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return;
    try {
      const current = safeStorage.getUserPrefs();
      localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify({ ...current, ...prefs }));
    } catch {
      // Ignore
    }
  },

  getBookmarks(): number[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  toggleBookmark(movieId: number): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const bookmarks = safeStorage.getBookmarks();
      const idx = bookmarks.indexOf(movieId);
      let isBookmarked = false;
      if (idx >= 0) {
        bookmarks.splice(idx, 1);
        isBookmarked = false;
      } else {
        bookmarks.push(movieId);
        isBookmarked = true;
      }
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return isBookmarked;
    } catch {
      return false;
    }
  },

  getPauseMotion(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEYS.PAUSE_MOTION) === 'true';
    } catch {
      return false;
    }
  },

  setPauseMotion(paused: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PAUSE_MOTION, paused ? 'true' : 'false');
    } catch {
      // Ignore
    }
  },
};

