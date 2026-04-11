import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const nav = [
  ['home', 'Home'],
  ['progress', 'Progress'],
  ['contest', 'Contest'],
  ['problems', 'Problems'],
  ['mentor', 'AI Mentor'],
  ['settings', 'Settings'],
] as const;

export function DashboardLayout({ children }: { children?: ReactNode }) {
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
      {children ?? <Outlet />}
    </div>
  );
}
