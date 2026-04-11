import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title = 'Nothing here yet', description = 'Data will appear once available.', action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', textAlign: 'center' }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="20" stroke="var(--border-default)" strokeWidth="1.5" />
        <circle cx="22" cy="28" r="3" fill="var(--border-default)" />
        <circle cx="32" cy="24" r="2" fill="var(--border-strong)" />
        <circle cx="42" cy="30" r="4" fill="var(--border-default)" />
        <circle cx="28" cy="38" r="2.5" fill="var(--border-default)" />
        <circle cx="38" cy="38" r="2" fill="var(--border-strong)" />
      </svg>
      <div>
        <p className="h3" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>{title}</p>
        <p className="caption" style={{ maxWidth: 280, margin: '0 auto' }}>{description}</p>
      </div>
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
}
