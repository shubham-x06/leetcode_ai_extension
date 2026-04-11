import { apiClient } from './axios';

export async function loginWithGoogle(token: string): Promise<{ token: string; needsLeetCodeLink: boolean; user: any }> {
  const res = await apiClient.post('/auth/google', { token });
  return res.data;
}

export async function linkLeetCode(leetcodeUsername: string): Promise<{ success: boolean; leetcodeUsername: string }> {
  const res = await apiClient.post('/auth/link-leetcode', { leetcodeUsername });
  return res.data;
}