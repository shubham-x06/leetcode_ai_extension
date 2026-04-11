import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DailyProblemProps {
  problem?: {
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags?: { name: string }[];
    acRate?: number;
  };
  motivation?: string;
  delay?: number;
}

export function DailyProblemCard({ problem, motivation, delay = 0 }: DailyProblemProps) {
  if (!problem) return null;

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Card variant="accent" delay={delay} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <p className="label">Today's Challenge · {dateStr}</p>
        <Badge variant={problem.difficulty as any}>{problem.difficulty}</Badge>
      </div>

      <h3 className="h2" style={{ marginBottom: 'var(--space-3)', lineHeight: 1.3 }}>
        {problem.title}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-6)' }}>
        {problem.topicTags?.slice(0, 3).map(tag => (
          <Badge key={tag.name} variant="neutral" style={{ fontSize: '10px', padding: '2px 8px' }}>
            {tag.name}
          </Badge>
        ))}
      </div>

      <div style={{ 
        flex: 1,
        fontStyle: 'italic',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        paddingLeft: 'var(--space-4)',
        borderLeft: '2px solid var(--accent)',
        marginBottom: 'var(--space-8)',
        lineHeight: 1.5
      }}>
        {motivation || "This problem will test your pattern recognition. Focus on the constraints first."}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Button 
          variant="primary" 
          style={{ width: '100%', marginBottom: 'var(--space-4)' }}
          onClick={() => window.open(`https://leetcode.com/problems/${problem.titleSlug}/`, '_blank')}
        >
          Solve Now →
        </Button>
        
        {problem.acRate !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="caption" style={{ fontSize: '11px' }}>
              Acceptance Rate: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{(problem.acRate * 100).toFixed(1)}%</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
