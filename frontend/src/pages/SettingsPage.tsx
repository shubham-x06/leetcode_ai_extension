import { useEffect, useState } from 'react';
import { apiFetch, setApiBaseUrl } from '../lib/api';
import { storageGet, storageSet } from '../lib/storage';

type Me = {
  leetcodeUsername?: string;
  preferredLanguage?: string;
  targetDifficulty?: string;
  dailyGoal?: number;
  theme?: 'light' | 'dark';
};

export function SettingsPage({ onTheme }: { onTheme: (t: 'light' | 'dark') => void }) {
  const [apiBase, setApiBase] = useState('');
  const [me, setMe] = useState<Me | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await storageGet(['apiBaseUrl']);
      setApiBase(typeof s.apiBaseUrl === 'string' ? s.apiBaseUrl : '');
      try {
        const { data } = await apiFetch<Me>('/api/user/me');
        setMe(data);
        if (data.theme) onTheme(data.theme);
      } catch {
        setMe(null);
      }
    })();
  }, [onTheme]);

  async function saveProfile() {
    setErr(null);
    setMsg(null);
    try {
      await apiFetch('/api/user/me', {
        method: 'PATCH',
        body: JSON.stringify({
          leetcodeUsername: me?.leetcodeUsername,
          preferredLanguage: me?.preferredLanguage,
          targetDifficulty: me?.targetDifficulty,
          dailyGoal: me?.dailyGoal,
          theme: me?.theme,
        }),
      });
      await setApiBaseUrl(apiBase);
      await storageSet({ apiBaseUrl: apiBase.trim() || undefined });
      setMsg('Saved.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    }
  }

  async function signOut() {
    await storageSet({ jwt: null, user: null });
    window.location.reload();
  }

  return (
    <div className="card">
      <h2>Settings</h2>
      {msg ? <div className="banner warn">{msg}</div> : null}
      {err ? <div className="banner error">{err}</div> : null}
      <label className="muted" style={{ display: 'block', marginBottom: 6 }}>
        API base URL
      </label>
      <input style={{ width: '100%', maxWidth: 480 }} value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
      <p className="muted">Default is http://localhost:3001. For a remote API, add that host to extension host_permissions.</p>
      <hr style={{ borderColor: 'var(--border)', margin: '1.25rem 0' }} />
      {me ? (
        <>
          <label className="muted">LeetCode username</label>
          <input
            style={{ width: '100%', maxWidth: 360, display: 'block', marginBottom: 12 }}
            value={me.leetcodeUsername || ''}
            onChange={(e) => setMe({ ...me, leetcodeUsername: e.target.value })}
          />
          <label className="muted">Preferred language</label>
          <select
            style={{ display: 'block', marginBottom: 12 }}
            value={me.preferredLanguage || 'Python'}
            onChange={(e) => setMe({ ...me, preferredLanguage: e.target.value })}
          >
            <option>Python</option>
            <option>Java</option>
            <option>C++</option>
            <option>JavaScript</option>
            <option>TypeScript</option>
            <option>Go</option>
          </select>
          <label className="muted">Target difficulty</label>
          <select
            style={{ display: 'block', marginBottom: 12 }}
            value={me.targetDifficulty || 'MIXED'}
            onChange={(e) => setMe({ ...me, targetDifficulty: e.target.value })}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="MIXED">Mixed</option>
          </select>
          <label className="muted">Daily problem goal (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            style={{ display: 'block', marginBottom: 12 }}
            value={me.dailyGoal ?? 2}
            onChange={(e) => setMe({ ...me, dailyGoal: Number(e.target.value) })}
          />
          <label className="muted">Theme</label>
          <select
            style={{ display: 'block', marginBottom: 12 }}
            value={me.theme || 'dark'}
            onChange={(e) => {
              const t = e.target.value as 'light' | 'dark';
              setMe({ ...me, theme: t });
              onTheme(t);
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </>
      ) : (
        <p className="muted">Sign in to edit profile settings.</p>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="primary" onClick={saveProfile}>
          Save
        </button>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
