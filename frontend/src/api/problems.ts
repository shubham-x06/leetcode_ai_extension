import { useQuery } from '@tanstack/react-query';
import api from './axios';

export interface Problem {
  title: string;
  titleSlug: string;
  difficulty: string;
  tags: string[];
}

export const problemsApi = {
  getDaily: async (): Promise<{ problem: Problem }> => {
    const response = await api.get('/problems/daily');
    return response.data;
  },

  getList: async (params?: { tags?: string[]; difficulty?: string }): Promise<{ problems: Problem[] }> => {
    const response = await api.get('/problems/list', { params });
    return response.data;
  },
};

export const useDailyProblem = () => {
  return useQuery({
    queryKey: ['dailyProblem'],
    queryFn: problemsApi.getDaily,
  });
};

export const useProblems = (params?: { tags?: string[]; difficulty?: string }) => {
  return useQuery({
    queryKey: ['problems', params],
    queryFn: () => problemsApi.getList(params),
  });
};