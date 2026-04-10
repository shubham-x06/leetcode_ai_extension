import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useSessionStore, type SessionUser } from '../store/sessionStore';

export function SettingsPage() {
  const navigate = useNavigate();
  const applyTheme = useSessionStore((s) => s.applyTheme);
  const setApiBaseUrlStore = useSessionStore((s) => s.setApiBaseUrl);
  const clearSession = useSessionStore((s) => s.clearSession);
  const setSession = useSessionStore((s) => s.setSession);
  const jwt = useSessionStore((s) => s.jwt);

  const meQ = useQuery({
    queryKey: ['user', 'me'],
    enabled: !!jwt,
    queryFn: async () => {
      const res = await api.get<SessionUser & { id?: string }>('/api/user/me');
      return res.data;
    },
  });

  const [apiBase, setApiBase] = useState('');
  const [me, setMe] = useState<SessionUser | null>(null);

  useEffect(() => {
    const base = useSessionStore.getState().apiBaseUrl;
    setApiBase(base);
  }, []);

  useEffect(() => {
    if (meQ.data) {
      setMe(meQ.data);
      if (meQ.data.theme) applyTheme(meQ.data.theme);
    }
  }, [meQ.data, applyTheme]);

  async function saveProfile() {
    try {
      await api.patch('/api/user/me', {
        leetcodeUsername: me?.leetcodeUsername,
        preferredLanguage: me?.preferredLanguage,
        targetDifficulty: me?.targetDifficulty,
        dailyGoal: me?.dailyGoal,
        theme: me?.theme,
      });
      await setApiBaseUrlStore(apiBase);
      const fresh = await api.get<SessionUser & { id?: string }>('/api/user/me');
      if (jwt) await setSession(jwt, fresh.data);
      toast.success('Saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  }

  async function signOut() {
    await clearSession();
    navigate('/login');
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <h2 className="text-base font-semibold">Settings</h2>
      <label className="mt-4 block text-xs text-[var(--muted)]">API base URL</label>
      <input
        className="mt-1 w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        value={apiBase}
        onChange={(e) => setApiBase(e.target.value)}
      />
      <p className="mt-1 text-xs text-[var(--muted)]">
        Default http://localhost:3001. Remote hosts must be listed in extension host_permissions.
      </p>
      <hr className="my-5 border-[var(--border)]" />
      {me ? (
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-[var(--muted)]">LeetCode username</label>
            <input
              className="mt-1 block w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={me.leetcodeUsername || ''}
              onChange={(e) => setMe({ ...me, leetcodeUsername: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Preferred language</label>
            <select
              className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
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
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Target difficulty</label>
            <select
              className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={me.targetDifficulty || 'MIXED'}
              onChange={(e) => setMe({ ...me, targetDifficulty: e.target.value })}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="MIXED">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Daily problem goal (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 block w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={me.dailyGoal ?? 2}
              onChange={(e) => setMe({ ...me, dailyGoal: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Theme</label>
            <select
              className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={me.theme || 'dark'}
              onChange={(e) => {
                const t = e.target.value as 'light' | 'dark';
                setMe({ ...me, theme: t });
                applyTheme(t);
              }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Loading profile…</p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0f0f12]"
          onClick={() => void saveProfile()}
        >
          Save
        </button>
        <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
