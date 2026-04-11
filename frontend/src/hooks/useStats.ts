import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/user';
import { useAuthStore } from '../store/useAuthStore';

export function useStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['user', 'stats'],
    enabled: !!token,
    queryFn: getStats,
  });
}
