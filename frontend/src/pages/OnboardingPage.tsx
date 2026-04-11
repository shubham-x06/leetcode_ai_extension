import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { linkLeetCode } from '../api/auth';
import { getMe } from '../api/user';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function OnboardingPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const trimmed = username.trim();
    if (!trimmed || !token) return;
    setLoading(true);
    try {
      await linkLeetCode(trimmed);
      const fresh = await getMe();
      await setSession(token, fresh);
      toast.success('LeetCode linked.');
      navigate('/app/home');
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'LEETCODE_USER_NOT_FOUND') {
        toast.error('That LeetCode username was not found.');
      } else {
        toast.error(err.message || 'Could not link account');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md px-4">
      <Card>
        <h1 className="text-lg font-semibold">Link LeetCode</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter your public LeetCode username so we can sync stats and personalize AI.
        </p>
        <label className="mt-4 block text-xs text-[var(--muted)]">Username</label>
        <input
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. shubham_codes"
          autoComplete="username"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={loading || !username.trim()} onClick={() => void onSubmit()}>
            {loading ? 'Verifying…' : 'Continue'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/app/settings')}>
            Skip for now
          </Button>
        </div>
      </Card>
    </div>
  );
}
