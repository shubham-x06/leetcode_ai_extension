import React from 'react';

type BadgeVariant = 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard' | 'success' | 'warning' | 'error' | 'neutral' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  easy:    { background: 'var(--easy-subtle)',    color: 'var(--easy)',    border: '1px solid rgba(0,184,163,0.2)' },
  Easy:    { background: 'var(--easy-subtle)',    color: 'var(--easy)',    border: '1px solid rgba(0,184,163,0.2)' },
  medium:  { background: 'var(--medium-subtle)',  color: 'var(--medium)',  border: '1px solid rgba(255,161,22,0.2)' },
  Medium:  { background: 'var(--medium-subtle)',  color: 'var(--medium)',  border: '1px solid rgba(255,161,22,0.2)' },
  hard:    { background: 'var(--hard-subtle)',    color: 'var(--hard)',    border: '1px solid rgba(255,55,95,0.2)' },
  Hard:    { background: 'var(--hard-subtle)',    color: 'var(--hard)',    border: '1px solid rgba(255,55,95,0.2)' },
  success: { background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' },
  warning: { background: 'var(--warning-subtle)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' },
  error:   { background: 'var(--error-subtle)',   color: 'var(--error)',   border: '1px solid rgba(239,68,68,0.2)' },
  neutral: { background: 'var(--bg-elevated)',    color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
  accent:  { background: 'var(--accent-subtle)',  color: '#A78BFA',        border: '1px solid var(--border-accent)' },
};

export function Badge({ variant = 'neutral', children, style }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: 'var(--radius-full)',
      padding: '3px 10px',
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: 1.6,
      ...variantStyles[variant] ?? variantStyles.neutral,
      ...style,
    }}>
      {children}
    </span>
  );
}
