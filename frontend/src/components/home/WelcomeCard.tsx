import React from 'react';
import { Card } from '../ui/Card';

interface WelcomeCardProps {
  user?: { name?: string; avatarUrl?: string; leetcodeUsername?: string | null };
  stats?: {
    streak?: number;
    totalSolved?: number | string;
    globalRank?: string | number;
  };
}

export function WelcomeCard({ user, stats }: WelcomeCardProps) {
  return (
    <Card variant="accent" fade={true} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
      <div style={{ flex: '1 1 300px' }}>
        <p className="label" style={{ marginBottom: 'var(--space-1)' }}>Welcome back</p>
        <h1 className="display gradient-text" style={{ marginBottom: 'var(--space-2)' }}>
          {user?.name?.split(' ')[0] || 'Coder'}
        </h1>
        <p className="body-lg" style={{ color: 'var(--text-muted)' }}>
          Keep pushing. Your next breakthrough is one problem away.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <StatPill 
          label="Streak" 
          value={stats?.streak || 0} 
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5.91c-3 0-5 2.5-5 2.5s-2-2.5-5-2.5-6 3.5-6 8.5c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5-3-8.5-4-8.5zM12.5 17c-2.5 0-4.5-2-4.5-4.5 0-1.5.8-2.8 2-3.5-.5 1 .5 2 1.5 1 0-1.5 1.5-3 1.5-3s1.5 1.5 1.5 3c1 1 2 0 1.5-1 1.2.7 2 2 2 3.5 0 2.5-2 4.5-4.5 4.5z"/></svg>} 
        />
        <StatPill 
          label="Solved" 
          value={stats?.totalSolved || '—'} 
        />
        <StatPill 
          label="Global Rank" 
          value={stats?.globalRank ? `#${Number(stats.globalRank).toLocaleString()}` : '—'} 
        />
      </div>
    </Card>
  );
}

function StatPill({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div style={{
      minWidth: 100,
      padding: 'var(--space-3) var(--space-5)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '24px',
        fontWeight: 700,
        color: 'var(--accent)',
        marginBottom: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}>
        {icon && <span style={{ color: 'var(--warning)', transform: 'translateY(-1px)' }}>{icon}</span>}
        {value}
      </div>
      <p className="caption" style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    </div>
  );
}
