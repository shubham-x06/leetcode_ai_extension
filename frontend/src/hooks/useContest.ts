import { useQuery } from '@tanstack/react-query';
import { getContest } from '../api/user';
import { useAuthStore } from '../store/useAuthStore';

export function useContest() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['user', 'contest'],
    enabled: !!token,
    queryFn: getContest,
  });
}
