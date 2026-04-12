import { useQuery } from '@tanstack/react-query'; 
import { getMe } from '../api/user'; 
import { useAuthStore } from '../store/useAuthStore'; 

export function useUser() { 
  const token = useAuthStore((s) => s.token); 
  return useQuery({ 
    queryKey: ['me'], 
    enabled: !!token, 
    queryFn: getMe, 
    staleTime: 60000 
  }); 
}
