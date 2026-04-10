import { useState } from 'react';
import { getGoogleAccessTokenInteractive, loginWithGoogleAccessToken } from '../lib/api';

export function LoginPage({ onAuthed }: { onAuthed: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setErr(null);
    setLoading(true);
    try {
      const accessToken = await getGoogleAccessTokenInteractive();
      await loginWithGoogleAccessToken(accessToken);
      onAuthed();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-panel card">
      <h2>Sign in</h2>
      <p className="muted">Use Google to sync your dashboard and personalize AI on LeetCode.</p>
      {err ? (
        <div className="banner error" style={{ marginBottom: '0.75rem' }}>
          {err}
        </div>
      ) : null}
      <button type="button" className="primary" disabled={loading} onClick={onLogin}>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>
      <p className="muted" style={{ marginTop: '1rem' }}>
        After login, set your LeetCode username in Settings so we can load your public stats.
      </p>
    </div>
  );
}
