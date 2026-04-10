import { create } from 'zustand';
import { storageGet, storageSet } from '../lib/storage';

const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export type UserPreferences = {
  targetDifficulty: string;
  dailyGoalCount: number;
  preferredLanguage: string;
  theme: 'light' | 'dark';
};

export type SessionUser = {
  name?: string;
  email?: string;
  avatarUrl?: string;
  leetcodeUsername?: string | null;
  preferences?: UserPreferences;
  cachedWeakTopics?: string[];
  bookmarkedProblems?: Array<{
    titleSlug: string;
    title: string;
    difficulty: string;
    addedAt?: string;
  }>;
};

type SessionState = {
  jwt: string | null;
  user: SessionUser | null;
  apiBaseUrl: string;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setSession: (jwt: string, user: SessionUser | null) => Promise<void>;
  clearSession: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;
  hydrate: () => Promise<void>;
  applyTheme: (t: 'light' | 'dark') => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  jwt: null,
  user: null,
  apiBaseUrl: DEFAULT_BASE,
  hydrated: false,

  setHydrated: (v) => set({ hydrated: v }),

  applyTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t);
  },

  setSession: async (jwt, user) => {
    await storageSet({ jwt, user });
    set({ jwt, user });
    if (user?.preferences?.theme) get().applyTheme(user.preferences.theme);
  },

  clearSession: async () => {
    await storageSet({ jwt: null, user: null });
    set({ jwt: null, user: null });
  },

  setApiBaseUrl: async (url) => {
    const u = url.trim() || DEFAULT_BASE;
    await storageSet({ apiBaseUrl: u });
    set({ apiBaseUrl: u });
  },

  hydrate: async () => {
    const s = await storageGet(['jwt', 'user', 'apiBaseUrl']);
    const jwt = typeof s.jwt === 'string' ? s.jwt : null;
    const user = (s.user as SessionUser) || null;
    const apiBaseUrl = typeof s.apiBaseUrl === 'string' ? s.apiBaseUrl : DEFAULT_BASE;
    if (user?.preferences?.theme) {
      document.documentElement.setAttribute('data-theme', user.preferences.theme);
    }
    set({ jwt, user, apiBaseUrl, hydrated: true });
  },
}));
