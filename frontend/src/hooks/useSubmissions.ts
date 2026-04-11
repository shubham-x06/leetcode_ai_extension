import { useQuery } from '@tanstack/react-query';
import { getSubmissions } from '../api/user';
import { useAuthStore } from '../store/useAuthStore';

export function useSubmissions(limit = 10) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['user', 'submissions', limit],
    enabled: !!token,
    queryFn: () => getSubmissions(limit),
  });
}
