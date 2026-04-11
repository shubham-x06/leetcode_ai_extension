import { create } from 'zustand';

interface User {
  name?: string;
  email: string;
  avatarUrl?: string;
  leetcodeUsername: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  setToken: async (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      if ((window as any).chrome && (window as any).chrome.storage) {
        await new Promise<void>((resolve) => {
          (window as any).chrome.storage.local.set({ authToken: token }, resolve);
        });
      }
    } else {
      localStorage.removeItem('authToken');
      if ((window as any).chrome && (window as any).chrome.storage) {
        await new Promise<void>((resolve) => {
          (window as any).chrome.storage.local.remove('authToken', resolve);
        });
      }
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem('authToken');
    if ((window as any).chrome && (window as any).chrome.storage) {
      (window as any).chrome.storage.local.remove('authToken');
    }
    set({ token: null, user: null });
  },
}));