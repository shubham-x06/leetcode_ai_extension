import React from 'react';
import { useFadeUp } from '../../hooks/useFadeUp';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  trend?: number; // positive = up, negative = down
  delay?: number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, accent = false, trend, delay = 0, icon }: StatCardProps) {
  const ref = useFadeUp(delay);
  return (
    <div
      ref={ref}
      className="fade-up"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        borderLeft: accent ? '3px solid var(--accent)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span className="label">{label}</span>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '32px',
        fontWeight: 700,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
      }}>
        {value}
      </div>
      {(sub || trend !== undefined) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {trend !== undefined && (
            <span style={{ color: trend >= 0 ? 'var(--success)' : 'var(--error)', fontSize: '13px', fontWeight: 500 }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="caption">{sub}</span>}
        </div>
      )}
    </div>
  );
}
