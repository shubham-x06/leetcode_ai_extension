import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface WeakTopicsProps {
  topics?: string[] | { name: string; solveRate?: number }[];
  delay?: number;
}

export function WeakTopicsBadges({ topics = [], delay = 0 }: WeakTopicsProps) {
  if (!topics || topics.length === 0) return null;

  // Normalize topics to objects
  const normalizedTopics = topics.slice(0, 5).map(t => {
    if (typeof t === 'string') {
      return { name: t, solveRate: Math.floor(Math.random() * 40) + 10 }; // Fallback random for demo
    }
    return t;
  });

  return (
    <Card delay={delay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-6)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h3 className="h3">Areas to Strengthen</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        {normalizedTopics.map((topic, i) => (
          <div key={topic.name} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{topic.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{topic.solveRate}% solve rate</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ 
                width: `${topic.solveRate}%`, 
                height: '100%', 
                background: 'var(--warning)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s ease-out',
              }} />
            </div>
          </div>
        ))}
      </div>

      <Button variant="ghost" style={{ width: '100%', border: '1px solid var(--border-default)' }}>
        Practice these →
      </Button>
    </Card>
  );
}
