import type { ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { AppProviders } from '../providers/AppProviders';
import { useSessionStore } from '../store/sessionStore';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ProgressPage } from '../pages/ProgressPage';
import { ContestPage } from '../pages/ContestPage';
import { ProblemsPage } from '../pages/ProblemsPage';
import { MentorPage } from '../pages/MentorPage';
import { SettingsPage } from '../pages/SettingsPage';

function RootRedirect() {
  const jwt = useSessionStore((s) => s.jwt);
  const hydrated = useSessionStore((s) => s.hydrated);
  if (!hydrated) {
    return <p className="p-6 text-slate-500">Loading…</p>;
  }
  return <Navigate to={jwt ? '/app/home' : '/login'} replace />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const jwt = useSessionStore((s) => s.jwt);
  const hydrated = useSessionStore((s) => s.hydrated);
  if (!hydrated) {
    return <p className="p-6 text-slate-500">Loading…</p>;
  }
  if (!jwt) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const nav = [
  ['home', 'Home'],
  ['progress', 'Progress'],
  ['contest', 'Contest'],
  ['problems', 'Problems'],
  ['mentor', 'AI Mentor'],
  ['settings', 'Settings'],
] as const;

function AppShell() {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-12">
      {!online ? (
        <div className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          You are offline. Stats may be cached; AI features need connectivity.
        </div>
      ) : null}
      <nav className="mb-5 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3" aria-label="Primary">
        {nav.map(([path, label]) => (
          <NavLink
            key={path}
            to={`/app/${path}`}
            className={({ isActive }) =>
              [
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[#0f0f12] dark:text-[#0f0f12]'
                  : 'border-[var(--border)] hover:border-[var(--accent)]',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <AppProviders>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="contest" element={<ContestPage />} />
            <Route path="problems" element={<ProblemsPage />} />
            <Route path="mentor" element={<MentorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AppProviders>
    </HashRouter>
  );
}
