import { useQuery } from '@tanstack/react-query';
import { getDailyProblem } from '../api/problems';
import { useAuthStore } from '../store/useAuthStore';

export function useDailyProblem() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['problems', 'daily'],
    enabled: !!token,
    queryFn: getDailyProblem,
    staleTime: 3_600_000,
  });
}
