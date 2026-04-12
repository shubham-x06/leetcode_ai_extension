import { create } from 'zustand';

interface User {
  name?: string;
  email: string;
  avatarUrl?: string;
  leetcodeUsername: string | null;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: User | null;
  _rehydrated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (changes: Partial<User>) => void;
  rehydrate: () => Promise<void>;
}

const STORAGE_KEY_TOKEN = 'authToken';
const STORAGE_KEY_USER = 'authUser';

function readFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage errors
  }
}

async function readFromChromeStorage(key: string): Promise<string | null> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve((result[key] as string) ?? null);
      });
    });
  }
  return null;
}

async function writeToChromeStorage(key: string, value: string | null): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      if (value === null) {
        chrome.storage.local.remove(key, () => resolve());
      } else {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      }
    });
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  _rehydrated: false,

  rehydrate: async () => {
    // Try chrome.storage first (extension context), fall back to localStorage
    let token = await readFromChromeStorage(STORAGE_KEY_TOKEN);
    let userRaw = await readFromChromeStorage(STORAGE_KEY_USER);

    if (!token) token = readFromStorage(STORAGE_KEY_TOKEN);
    if (!userRaw) userRaw = readFromStorage(STORAGE_KEY_USER);

    let user: User | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as User;
      } catch {
        user = null;
      }
    }

    if (token && !user) {
      // Corrupt state or migration from old version. Force re-login.
      token = null;
      writeToStorage(STORAGE_KEY_TOKEN, null);
      writeToChromeStorage(STORAGE_KEY_TOKEN, null);
    }

    set({ token: token ?? null, user, _rehydrated: true });
  },

  login: (token, user) => {
    const userJson = JSON.stringify(user);
    writeToStorage(STORAGE_KEY_TOKEN, token);
    writeToStorage(STORAGE_KEY_USER, userJson);
    writeToChromeStorage(STORAGE_KEY_TOKEN, token);
    writeToChromeStorage(STORAGE_KEY_USER, userJson);
    set({ token, user });
  },

  logout: () => {
    writeToStorage(STORAGE_KEY_TOKEN, null);
    writeToStorage(STORAGE_KEY_USER, null);
    writeToChromeStorage(STORAGE_KEY_TOKEN, null);
    writeToChromeStorage(STORAGE_KEY_USER, null);
    set({ token: null, user: null });
  },

  updateUser: (changes) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...changes } : null;
      if (updated) {
        const userJson = JSON.stringify(updated);
        writeToStorage(STORAGE_KEY_USER, userJson);
        writeToChromeStorage(STORAGE_KEY_USER, userJson);
      }
      return { user: updated };
    }),
}));

export default useAuthStore;