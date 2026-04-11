import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { postGoogleLogin } from '../api/auth';
import { useAuthStore, type AuthUser } from '../store/useAuthStore';

function getGoogleAccessTokenViaBackground(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      reject(new Error('Google sign-in is only available inside the Chrome extension.'));
      return;
    }
    chrome.runtime.sendMessage({ type: 'GET_GOOGLE_ACCESS_TOKEN', interactive: true }, (resp) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!resp?.ok || !resp.token) {
        reject(new Error(resp?.error || 'Could not get Google token'));
        return;
      }
      resolve(resp.token);
    });
  });
}

export function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (hydrated && token) {
    return <Navigate to="/app/home" replace />;
  }

  async function onLogin() {
    setErr(null);
    setLoading(true);
    try {
      const accessToken = await getGoogleAccessTokenViaBackground();
      const data = await postGoogleLogin({ accessToken });
      await setSession(data.token, data.user as AuthUser);
      if (data.needsLeetCodeLink) {
        navigate('/app/onboarding');
        return;
      }
      navigate('/app/home');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Sign in</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Use Google to sync your dashboard and personalize AI on LeetCode.
      </p>
      {err ? (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      ) : null}
      <button
        type="button"
        className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0f0f12] disabled:opacity-50"
        disabled={loading}
        onClick={() => void onLogin()}
      >
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>
      <p className="mt-4 text-xs text-[var(--muted)]">
        After login, link your LeetCode username so we can load your public stats.
      </p>
    </div>
  );
}
