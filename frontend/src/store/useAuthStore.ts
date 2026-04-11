import { create } from 'zustand';
import { storageGet, storageSet } from '../lib/storage';
import { DEFAULT_API_BASE_URL } from '../lib/constants';

export type UserPreferences = {
  targetDifficulty: string;
  dailyGoalCount: number;
  preferredLanguage: string;
  theme: 'light' | 'dark';
};

/** Authenticated user profile (API + session). */
export type AuthUser = {
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

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  apiBaseUrl: string;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
  setSession: (token: string, user: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;
  hydrate: () => Promise<void>;
  applyTheme: (t: 'light' | 'dark') => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  hydrated: false,

  setHydrated: (v) => set({ hydrated: v }),

  applyTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t);
  },

  setToken: async (token) => {
    const user = get().user;
    await storageSet({ jwt: token, user });
    set({ token });
  },

  setUser: async (user) => {
    const token = get().token;
    await storageSet({ jwt: token, user });
    set({ user });
    if (user?.preferences?.theme) get().applyTheme(user.preferences.theme);
  },

  setSession: async (token, user) => {
    await storageSet({ jwt: token, user });
    set({ token, user });
    if (user?.preferences?.theme) get().applyTheme(user.preferences.theme);
  },

  logout: async () => {
    await storageSet({ jwt: null, user: null });
    set({ token: null, user: null });
  },

  setApiBaseUrl: async (url) => {
    const u = url.trim() || DEFAULT_API_BASE_URL;
    await storageSet({ apiBaseUrl: u });
    set({ apiBaseUrl: u });
  },

  hydrate: async () => {
    const s = await storageGet(['jwt', 'user', 'apiBaseUrl']);
    const token = typeof s.jwt === 'string' ? s.jwt : null;
    const user = (s.user as AuthUser) || null;
    const apiBaseUrl = typeof s.apiBaseUrl === 'string' ? s.apiBaseUrl : DEFAULT_API_BASE_URL;
    if (user?.preferences?.theme) {
      document.documentElement.setAttribute('data-theme', user.preferences.theme);
    }
    set({ token, user, apiBaseUrl, hydrated: true });
  },
}));
