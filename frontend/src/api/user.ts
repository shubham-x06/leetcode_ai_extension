import { useQuery } from '@tanstack/react-query';
import api from './axios';

export interface User {
  name?: string;
  email: string;
  avatarUrl?: string;
  leetcodeUsername: string | null;
  preferences: {
    targetDifficulty: string;
    dailyGoalCount: number;
    preferredLanguage: string;
    theme: string;
  };
  bookmarkedProblems: Array<{
    titleSlug: string;
    title: string;
    difficulty: string;
    addedAt: string;
  }>;
  cachedWeakTopics: string[];
}

export interface UserStats {
  profile: Record<string, unknown>;
  solved: Record<string, unknown>;
  skills: Record<string, unknown>;
  languages: Record<string, unknown>;
}

export interface CalendarData {
  submissionCalendar: string;
  streak: number;
  longestStreak: number;
  totalActiveDays: number;
}

export interface ContestData {
  contestDetails: Record<string, unknown>;
  contestHistory: Array<Record<string, unknown>>;
}

export interface Submission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get('/user/me');
    return response.data;
  },
  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/user/stats');
    return response.data;
  },
  getCalendar: async (year?: string): Promise<CalendarData> => {
    const response = await api.get('/user/calendar', { params: year ? { year } : {} });
    return response.data;
  },
  getContest: async (): Promise<ContestData> => {
    const response = await api.get('/user/contest');
    return response.data;
  },
  getSubmissions: async (limit?: number): Promise<Submission[]> => {
    const response = await api.get('/user/submissions', { params: limit ? { limit } : {} });
    return response.data;
  },
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: userApi.getMe,
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: userApi.getStats,
  });
};

export const useCalendar = (year?: string) => {
  return useQuery({
    queryKey: ['calendar', year],
    queryFn: () => userApi.getCalendar(year),
  });
};

export const useContest = () => {
  return useQuery({
    queryKey: ['contest'],
    queryFn: userApi.getContest,
  });
};

export const useSubmissions = (limit?: number) => {
  return useQuery({
    queryKey: ['submissions', limit],
    queryFn: () => userApi.getSubmissions(limit),
  });
};