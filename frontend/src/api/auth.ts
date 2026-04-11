import { api } from './axios';
import type { AuthUser } from '../store/useAuthStore';

export type GoogleLoginResponse = {
  token: string;
  needsLeetCodeLink?: boolean;
  user: AuthUser;
};

export async function postGoogleLogin(body: { token?: string; accessToken?: string }): Promise<GoogleLoginResponse> {
  const { data } = await api.post<GoogleLoginResponse>('/api/auth/google', body);
  return data;
}

export async function linkLeetCode(leetcodeUsername: string): Promise<{ success: boolean; leetcodeUsername: string }> {
  const { data } = await api.post('/api/auth/link-leetcode', { leetcodeUsername });
  return data;
}
