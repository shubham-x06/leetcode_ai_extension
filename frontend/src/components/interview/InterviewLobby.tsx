import React from 'react';
import { Spinner } from '../ui/Spinner';

interface Props {
  onStart: () => void;
  isLoading: boolean;
  error: string;
}

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.2)',
    title: '60 Minutes',
    desc: 'Real interview time pressure with a live countdown timer from Problem 1.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.2)',
    title: '3 DSA Problems',
    desc: 'Easy → Medium → Hard, tailored to your tracked weak topics.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
    title: 'AI Interviewer',
    desc: 'Challenges your reasoning, asks follow-ups and evaluates communication.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    title: 'Performance Report',
    desc: 'Scored across 6 dimensions with specific, actionable feedback per problem.',
  },
];

const rules = [
  'Think out loud — type your reasoning before and while coding',
  'The AI interviewer will ask follow-up questions. Answer them.',
  'Use "Run" to test your code against sample cases before submitting',
  'Click "Submit →" to lock in your answer and move to the next problem',
  'You can end the interview early — feedback is generated immediately',
  'Do not refresh the page — your session will be lost',
];

export function InterviewLobby({ onStart, isLoading, error }: Props) {
  return (
    <div style={{
      maxWidth: 780, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-8)',
      padding: 'var(--space-8) var(--space-4)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        {/* Decorative blob */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 300, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 'var(--radius-full)', padding: '6px 18px',
            marginBottom: 'var(--space-6)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              FAANG-Style Interview
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05,
            color: 'var(--text-primary)', marginBottom: 'var(--space-5)',
          }}>
            AlgoMaster{' '}
            <span style={{ color: '#10B981' }}>
              Simulator
            </span>
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto',
            lineHeight: 1.6, fontWeight: 400,
          }}>
            A real 60-minute technical interview with an AI that probes your thinking.
            No shortcuts. No hints. Just you and the problems.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
        {features.map(item => (
          <div key={item.title} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
            transition: 'all 0.2s',
            position: 'relative', overflow: 'hidden'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = item.border;
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: item.bg, border: `1px solid ${item.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.color,
            }}>
              {item.icon}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.01em' }}>
                {item.title}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-7)',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-5)', letterSpacing: '-0.02em' }}>
          Interview Rules
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <div style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginTop: 2,
              }}>{i + 1}</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
          fontSize: 14, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
        <button
          onClick={onStart}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 60px', borderRadius: 'var(--radius-full)',
            background: '#10B981',
            border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 18, fontWeight: 700, color: '#fff',
            boxShadow: '0 8px 30px rgba(16,185,129,0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isLoading ? 0.7 : 1,
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(16,185,129,0.4)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.3)'; }}
        >
          {isLoading ? <Spinner size="sm" /> : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
          {isLoading ? 'Selecting your problems...' : 'Start Interview'}
        </button>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Problems are selected based on your tracked weak topics
        </p>
      </div>
    </div>
  );
}
