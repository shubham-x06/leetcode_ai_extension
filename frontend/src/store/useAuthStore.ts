import { create } from 'zustand';

interface User {
  name?: string;
  email: string;
  avatarUrl?: string;
  leetcodeUsername: string | null;
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (changes: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  login: (token, user) => {
    localStorage.setItem('authToken', token);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ authToken: token });
    }
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove('authToken');
    }
    set({ token: null, user: null });
  },
  updateUser: (changes) => set((state) => ({ user: state.user ? { ...state.user, ...changes } : null }))
}));

export default useAuthStore;