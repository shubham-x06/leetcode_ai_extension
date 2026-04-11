import api from './axios';

export interface AuthResponse {
  token: string;
  user: {
    name?: string;
    email: string;
    avatarUrl?: string;
    leetcodeUsername: string | null;
  };
}

export const authApi = {
  googleLogin: async (token: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },

  linkLeetcode: async (username: string): Promise<void> => {
    await api.post('/auth/link-leetcode', { leetcodeUsername: username });
  },
};