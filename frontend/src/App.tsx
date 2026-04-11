import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { HomePage } from './pages/HomePage';
import { ProgressPage } from './pages/ProgressPage';
import { ContestPage } from './pages/ContestPage';
import { ProblemsPage } from './pages/ProblemsPage';
import { AIMentorPage } from './pages/AIMentorPage';
import { SettingsPage } from './pages/SettingsPage';

function RootRedirect() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) {
    return <p className="p-6 text-slate-500">Loading…</p>;
  }
  return <Navigate to={token ? '/app/home' : '/login'} replace />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) {
    return <p className="p-6 text-slate-500">Loading…</p>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <HashRouter>
      <AppProviders>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="contest" element={<ContestPage />} />
            <Route path="problems" element={<ProblemsPage />} />
            <Route path="mentor" element={<AIMentorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AppProviders>
    </HashRouter>
  );
}
