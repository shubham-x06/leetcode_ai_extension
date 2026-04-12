import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { loginWithGoogle } from '../api/auth';
import { Spinner } from '../components/ui/Spinner';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await loginWithGoogle(response.credential);
      login(data.token, data.user);
      navigate(data.needsLeetCodeLink ? '/onboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-lg)',
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-4)', boxShadow: 'var(--shadow-accent)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            LeetAI
          </span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 'var(--space-3)' }}>
            Welcome <span className="gradient-text">back</span>
          </h1>
          <p className="body" style={{ color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto' }}>
            Sign in to access your personalized LeetCode AI companion.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--error-subtle)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)', fontSize: 14, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Google Button */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {isLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              height: 48, background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500,
            }}>
              <Spinner size="sm" />
              Signing in...
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError('Google sign-in failed.')}
                theme="outline"
                size="large"
                shape="rectangular"
                width={380}
              />
            </div>
          )}
        </div>

        {/* Fine print */}
        <p className="caption" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          By signing in, you agree to use your own LeetCode data responsibly.
        </p>

        {/* Divider + footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-5)', textAlign: 'center' }}>
          <button 
            onClick={() => {
              login('mock-jwt-token-123', { 
                name: 'Demo User', 
                email: 'demo@example.com', 
                avatarUrl: '', 
                leetcodeUsername: 'shubham-x06' 
              });
              navigate('/');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 'var(--space-4)',
              textDecoration: 'underline'
            }}
          >
            Access Demo Dashboard
          </button>
          <p className="caption">LeetCode AI Companion · Built for serious learners</p>
        </div>
      </div>
    </div>
  );
}
