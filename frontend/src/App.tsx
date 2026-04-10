import { useCallback, useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ProgressPage } from './pages/ProgressPage';
import { ContestPage } from './pages/ContestPage';
import { ProblemsPage } from './pages/ProblemsPage';
import { MentorPage } from './pages/MentorPage';
import { SettingsPage } from './pages/SettingsPage';
import { storageGet } from './lib/storage';

type Tab = 'home' | 'progress' | 'contest' | 'problems' | 'mentor' | 'settings';

export default function App() {
  const [jwt, setJwt] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const applyTheme = useCallback((t: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await storageGet(['jwt', 'user']);
      setJwt(typeof s.jwt === 'string' ? s.jwt : undefined);
      const u = s.user as { theme?: 'light' | 'dark' } | undefined;
      if (u?.theme) applyTheme(u.theme);
      setLoading(false);
    })();
  }, [applyTheme]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!jwt) {
    return (
      <div className="app-shell">
        <LoginPage
          onAuthed={() => {
            storageGet(['jwt']).then((s) => setJwt(typeof s.jwt === 'string' ? s.jwt : undefined));
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {!online ? (
        <div className="banner warn">You are offline. Stats may be cached; AI features need connectivity.</div>
      ) : null}
      <nav className="app-nav" aria-label="Primary">
        {(
          [
            ['home', 'Home'],
            ['progress', 'Progress'],
            ['contest', 'Contest'],
            ['problems', 'Problems'],
            ['mentor', 'AI Mentor'],
            ['settings', 'Settings'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'home' ? <HomePage /> : null}
      {tab === 'progress' ? <ProgressPage /> : null}
      {tab === 'contest' ? <ContestPage /> : null}
      {tab === 'problems' ? <ProblemsPage /> : null}
      {tab === 'mentor' ? <MentorPage /> : null}
      {tab === 'settings' ? <SettingsPage onTheme={applyTheme} /> : null}
    </div>
  );
}
