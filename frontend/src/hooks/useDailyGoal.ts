import { useQuery } from '@tanstack/react-query';
import { getDailyGoal } from '../api/ai';
import { useAuthStore } from '../store/useAuthStore';

export function useDailyGoal() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['ai', 'daily-goal'],
    enabled: !!token && !!user?.leetcodeUsername,
    queryFn: getDailyGoal,
  });
}
