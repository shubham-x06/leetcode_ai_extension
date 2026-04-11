import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardLayout from './pages/DashboardLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { 
      retry: 1, 
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { token, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        theme="dark" 
        position="top-right" 
        expand={false} 
        richColors 
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
      <Router>
        <Routes>
          {!token ? (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : !user?.leetcodeUsername && user?.leetcodeUsername !== '' ? (
            <>
              <Route path="/onboard" element={<OnboardingPage />} />
              <Route path="*" element={<Navigate to="/onboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/*" element={<DashboardLayout />} />
            </>
          )}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
