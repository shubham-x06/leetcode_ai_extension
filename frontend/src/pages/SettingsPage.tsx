import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { linkLeetCode } from '../api/auth';
import { getMe, patchPreferences } from '../api/user';
import { useAuthStore, type AuthUser, type UserPreferences } from '../store/useAuthStore';
import { useUser } from '../hooks/useUser';

const defaultPrefs = (): UserPreferences => ({
  targetDifficulty: 'Mixed',
  dailyGoalCount: 1,
  preferredLanguage: 'Python',
  theme: 'light',
});

export function SettingsPage() {
  const navigate = useNavigate();
  const applyTheme = useAuthStore((s) => s.applyTheme);
  const setApiBaseUrlStore = useAuthStore((s) => s.setApiBaseUrl);
  const logout = useAuthStore((s) => s.logout);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);

  const meQ = useUser();

  const [apiBase, setApiBase] = useState('');
  const [me, setMe] = useState<AuthUser | null>(null);
  const [leetcodeInput, setLeetcodeInput] = useState('');

  useEffect(() => {
    const base = useAuthStore.getState().apiBaseUrl;
    setApiBase(base);
  }, []);

  useEffect(() => {
    if (meQ.data) {
      setMe(meQ.data);
      setLeetcodeInput(meQ.data.leetcodeUsername || '');
      const t = meQ.data.preferences?.theme;
      if (t) applyTheme(t);
    }
  }, [meQ.data, applyTheme]);

  const prefs = me?.preferences ?? defaultPrefs();

  async function saveProfile() {
    try {
      await patchPreferences({
        targetDifficulty: prefs.targetDifficulty,
        dailyGoalCount: prefs.dailyGoalCount,
        preferredLanguage: prefs.preferredLanguage,
        theme: prefs.theme,
      });
      const trimmed = leetcodeInput.trim();
      if (trimmed) {
        await linkLeetCode(trimmed);
      }
      await setApiBaseUrlStore(apiBase);
      const fresh = await getMe();
      if (token) await setSession(token, fresh);
      toast.success('Saved.');
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'LEETCODE_USER_NOT_FOUND') {
        toast.error('That LeetCode username was not found.');
      } else {
        toast.error(err.message || 'Save failed');
      }
    }
  }

  async function signOut() {
    await logout();
    navigate('/login');
  }

  function updatePrefs(p: Partial<UserPreferences>) {
    if (!me) return;
    setMe({
      ...me,
      preferences: { ...defaultPrefs(), ...me.preferences, ...p },
    });
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
              value={leetcodeInput}
              onChange={(e) => setLeetcodeInput(e.target.value)}
              placeholder="Public profile username"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">Verified against LeetCode before save.</p>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Preferred language</label>
            <select
              className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={prefs.preferredLanguage}
              onChange={(e) => updatePrefs({ preferredLanguage: e.target.value })}
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
              value={prefs.targetDifficulty}
              onChange={(e) => updatePrefs({ targetDifficulty: e.target.value })}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Daily problem goal (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 block w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={prefs.dailyGoalCount}
              onChange={(e) => updatePrefs({ dailyGoalCount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Theme</label>
            <select
              className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
              value={prefs.theme}
              onChange={(e) => {
                const t = e.target.value as 'light' | 'dark';
                updatePrefs({ theme: t });
                applyTheme(t);
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
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
