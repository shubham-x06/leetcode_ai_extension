import React from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import HomePage from './HomePage';
import ProblemsPage from './ProblemsPage';
import ProgressPage from './ProgressPage';
import ContestPage from './ContestPage';
import AIMentorPage from './AIMentorPage';
import SettingsPage from './SettingsPage';
import { ThemeToggle } from '../components/ui/ThemeToggle';

// SVG Icons
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const ProgressIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const ContestIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
);
const ProblemsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const AIIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NAV_ITEMS = [
  { to: '/',          label: 'Home',      Icon: HomeIcon,     end: true },
  { to: '/progress',  label: 'Progress',  Icon: ProgressIcon },
  { to: '/contest',   label: 'Contest',   Icon: ContestIcon },
  { to: '/problems',  label: 'Problems',  Icon: ProblemsIcon },
  { to: '/ai-mentor', label: 'AI Mentor', Icon: AIIcon },
  { to: '/settings',  label: 'Settings',  Icon: SettingsIcon },
];

const PAGE_TITLES: Record<string, string> = {
  '/':          'Home',
  '/progress':  'Progress',
  '/contest':   'Contest',
  '/problems':  'Problems',
  '/ai-mentor': 'AI Mentor',
  '/settings':  'Settings',
};

function UserAvatar({ name, size = 36 }: { name?: string; size?: number }) {
  const initials = (name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--accent), #A78BFA)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size < 32 ? '11px' : '14px', fontWeight: 600, color: '#fff',
    }}>
      {initials}
    </div>
  );
}

export default function DashboardLayout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        padding: 'var(--space-6)',
      }}>
        {/* Logo */}
        <div style={{ paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AIIcon />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              LeetAI
            </span>
          </div>
        </div>

        {/* User */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-8)' }}>
            <UserAvatar name={user.name} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.leetcodeUsername ? `@${user.leetcodeUsername}` : 'No username linked'}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 500,
                textDecoration: 'none',
                transition: 'background var(--transition-fast), color var(--transition-fast)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              })}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
              transition: 'color var(--transition-fast), background var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--error-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ marginLeft: 240, flex: 1, overflowY: 'auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-6) var(--space-8)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <h2 className="h2" style={{ fontFamily: 'var(--font-display)' }}>{pageTitle}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <ThemeToggle />
            {user && <UserAvatar name={user.name} size={32} />}
          </div>
        </div>

        {/* Page Content */}
        <div key={location.pathname} className="page-enter" style={{ padding: 'var(--space-8)' }}>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="progress"  element={<ProgressPage />} />
            <Route path="contest"   element={<ContestPage />} />
            <Route path="problems"  element={<ProblemsPage />} />
            <Route path="ai-mentor" element={<AIMentorPage />} />
            <Route path="settings"  element={<SettingsPage />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* ── Mobile Bottom Tabs ── */}
      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          main  { margin-left: 0 !important; padding-bottom: 80px; }
          .mobile-tabs { display: flex !important; }
        }
        .mobile-tabs { display: none; }
      `}</style>
      <nav className="mobile-tabs" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)',
        zIndex: 200, alignItems: 'center', justifyContent: 'space-around',
      }}>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontSize: 10, fontWeight: 500, textDecoration: 'none', padding: '8px 12px',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          })}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
