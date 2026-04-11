import { useQuery } from '@tanstack/react-query';
import { getCalendar } from '../api/user';
import { useAuthStore } from '../store/useAuthStore';

export function useCalendar(year?: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['user', 'calendar', year],
    enabled: !!token,
    queryFn: () => getCalendar(year),
  });
}
