import React from 'react';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';

interface Props {
  onStart: () => void;
  isLoading: boolean;
  error: string;
}

export function InterviewLobby({ onStart, isLoading, error }: Props) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-full)', padding: '6px 16px',
          marginBottom: 'var(--space-5)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Beta Feature
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.05,
          color: 'var(--text-primary)', marginBottom: 'var(--space-4)',
        }}>
          AI Interview{' '}
          <span style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #A78BFA 50%, #38BDF8 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Simulator
          </span>
        </h1>
        <p className="body-lg" style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
          A real 45-minute FAANG-style technical interview. Two DSA problems.
          AI interviewer. Live feedback. No shortcuts.
        </p>
      </div>

      {/* What to expect */}
      <Card>
        <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>What to expect</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
          {[
            { icon: '⏱', title: '45 Minutes', desc: 'Real interview time pressure. Timer counts down from the first problem.' },
            { icon: '💻', title: '2 DSA Problems', desc: 'Tailored to your weak topics. Problem 1 is warm-up, Problem 2 is harder.' },
            { icon: '🧑💼', title: 'AI Interviewer', desc: 'Asks follow-ups, challenges your thinking, evaluates your communication.' },
            { icon: '📊', title: 'Detailed Report', desc: 'Scored across 6 dimensions with specific actionable feedback.' },
          ].map(item => (
            <div key={item.title} style={{
              background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
            }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Rules */}
      <Card>
        <h3 className="h3" style={{ marginBottom: 'var(--space-4)' }}>Interview rules</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            'Think out loud — type your reasoning before and while coding',
            'The AI interviewer will ask follow-up questions. Answer them.',
            'You can ask for hints but the interviewer may not always give them',
            'When you finish a problem, click "Next Problem" to continue',
            'You can end the interview early — feedback is generated immediately',
            'Do not refresh the page — your session will be lost',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              }}>{i + 1}</span>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rule}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--error-subtle)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
          fontSize: 14, color: 'var(--error)',
        }}>
          {error}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 'var(--space-8)' }}>
        <button
          onClick={onStart}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 48px', borderRadius: 'var(--radius-lg)',
            background: 'var(--accent)', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 17, fontWeight: 600, color: '#fff',
            boxShadow: 'var(--shadow-accent)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {isLoading ? <Spinner size="sm" /> : null}
          {isLoading ? 'Selecting your problems...' : 'Start Interview →'}
        </button>
      </div>
    </div>
  );
}
