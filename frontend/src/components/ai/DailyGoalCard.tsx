import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

interface Problem {
  title: string;
  titleSlug: string;
  difficulty: string;
}

interface DailyGoalCardProps {
  motivation?: string;
  problems?: Problem[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function DailyGoalCard({ motivation, problems = [], isLoading, onRefresh }: DailyGoalCardProps) {
  if (isLoading) {
    return (
      <Card variant="accent">
        <Skeleton height={24} width={150} style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height={60} style={{ marginBottom: 'var(--space-6)' }} />
        <Skeleton height={40} style={{ marginBottom: 'var(--space-2)' }} />
        <Skeleton height={40} />
      </Card>
    );
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const cleanMotivation = (motivation || "Focus on mastering tree traversals today. These problems build a foundation for more advanced graph algorithms.")
    .replace(/\*\*Motivational Paragraph\*\*[:]?/gi, '')
    .replace(/\*\*Ordered Problem List.*?\*\*/gi, '')
    .split(/\*\*.*?\*\*/)[0] // Take only the first part before any other header
    .trim();

  return (
    <Card variant="accent">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <h3 className="h3">Today's Study Goal</h3>
          {onRefresh && (
            <button 
              onClick={(e) => { e.preventDefault(); onRefresh(); }}
              className="refresh-btn"
              title="Refresh recommendations"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
              </svg>
            </button>
          )}
        </div>
        <Badge variant="accent">{dateStr}</Badge>
      </div>

      <div style={{ 
        fontStyle: 'italic', 
        color: 'var(--text-secondary)', 
        paddingLeft: 'var(--space-4)', 
        borderLeft: '2px solid var(--accent)',
        marginBottom: 'var(--space-8)',
        fontSize: '15px',
        lineHeight: 1.6
      }}>
        {cleanMotivation}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {problems.map((p, i) => (
          <div 
            key={p.titleSlug} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Badge variant={p.difficulty.toLowerCase() as any}>{p.difficulty}</Badge>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{p.title}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              style={{ color: 'var(--accent)', paddingRight: 0 }}
              onClick={() => window.open(`https://leetcode.com/problems/${p.titleSlug}/`, '_blank')}
            >
              Solve →
            </Button>
          </div>
        ))}
        {problems.length === 0 && (
          <p className="caption" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>All goals completed! Great work.</p>
        )}
      </div>
    </Card>
  );
}
