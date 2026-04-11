import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { linkLeetCode } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export default function OnboardingPage() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Validation states
  const [isValidFormat, setIsValidFormat] = useState(true);

  const validateUsername = (val: string) => {
    // Alphanumeric and underscores only
    const regex = /^[a-zA-Z0-9_]*$/;
    return regex.test(val);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    setIsValidFormat(validateUsername(val));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !isValidFormat) {
      setError('Please enter a valid LeetCode username.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await linkLeetCode(username.trim());
      if (res.success) {
        updateUser({ leetcodeUsername: res.leetcodeUsername });
        navigate('/');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Username not found on LeetCode. Check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    updateUser({ leetcodeUsername: '' });
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%), var(--bg-primary)`,
      padding: 'var(--space-6)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-10)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}>
        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 'var(--space-6)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Step 2 of 2</p>
          <h2 className="h2" style={{ marginBottom: 'var(--space-3)' }}>Link your LeetCode</h2>
          <p className="body" style={{ color: 'var(--text-secondary)' }}>
            We'll use your public profile to personalize hints, track progress, and recommend problems.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="your-leetcode-username"
              style={{
                width: '100%',
                height: 44,
                background: 'var(--bg-surface)',
                border: `1px solid ${!isValidFormat || error ? 'var(--error)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0 16px',
                color: 'var(--text-primary)',
                fontSize: 15,
                outline: 'none',
                transition: 'var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = !isValidFormat || error ? 'var(--error)' : 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {loading && (
              <div style={{ position: 'absolute', right: 12, top: 11 }}>
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {!isValidFormat && (
            <p style={{ color: 'var(--error)', fontSize: 12, marginTop: -8 }}>
              Username can only contain letters, numbers, and underscores
            </p>
          )}

          {error && !loading && (
            <p style={{ color: 'var(--error)', fontSize: 12, marginTop: -8 }}>
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            isLoading={loading} 
            disabled={!username.trim() || !isValidFormat}
            size="lg"
            style={{ width: '100%' }}
          >
            Connect Account
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleSkip}
            style={{ width: '100%' }}
          >
            Skip for now
          </Button>
        </form>

        <p className="caption" style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--text-muted)' }}>
          Limited functionality if you skip linking.
        </p>
      </div>
    </div>
  );
}
