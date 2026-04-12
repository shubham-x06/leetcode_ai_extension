import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
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
  const { token, user, _rehydrated } = useAuthStore();
  const { theme } = useThemeStore();

  // Do not render routes until storage rehydration is complete
  // This prevents redirect to /login on every page reload
  if (!_rehydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.3)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        theme={theme} 
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
