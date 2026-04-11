import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (err, q) => {
        if (q.meta?.silent) return;
        if (err instanceof Error) toast.error(err.message);
      },
    },
    mutations: {
      retry: 0,
      onError: (err, _v, _ctx, mutation) => {
        if (mutation.meta?.silent) return;
        if (err instanceof Error) toast.error(err.message);
      },
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors closeButton position="top-center" />
    </QueryClientProvider>
  );
}
