import React from 'react';

export function InterviewTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds < 5 * 60;
  const isCritical = seconds < 2 * 60;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 'var(--radius-md)',
      background: isCritical ? 'var(--error-subtle)' : isLow ? 'var(--warning-subtle)' : 'var(--bg-tertiary)',
      border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : isLow ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)'}`,
      transition: 'all 0.5s',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={isCritical ? 'var(--error)' : isLow ? 'var(--warning)' : 'var(--text-muted)'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span style={{
        fontFamily: 'var(--font-mono, monospace)', fontSize: 15, fontWeight: 700, letterSpacing: '0.05em',
        color: isCritical ? 'var(--error)' : isLow ? 'var(--warning)' : 'var(--text-primary)',
      }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}
