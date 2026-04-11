import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

interface Recommendation {
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  reason?: string;
  topicTags?: { name: string }[];
}

export function RecommendationCard({ recommendation, isLoading, onRefresh }: { recommendation?: Recommendation; isLoading?: boolean; onRefresh?: () => void }) {
  if (isLoading) {
    return (
      <Card hoverable style={{ border: '1px solid var(--border-accent)' }}>
        <Skeleton height={20} width={120} style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height={32} width="80%" style={{ marginBottom: 'var(--space-6)' }} />
        <Skeleton height={80} style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height={44} />
      </Card>
    );
  }

  if (!recommendation) return null;

  return (
    <Card hoverable style={{ border: '1px solid var(--border-accent)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Blur */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'var(--accent)', filter: 'blur(60px)', opacity: 0.15, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
        <span className="label" style={{ color: 'var(--accent)' }}>Recommended Next</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
          <path d="M12 2l3.09 8.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l8.91-1.01L12 2z"/>
        </svg>
      </div>

      <h2 className="display gradient-text" style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>
        {recommendation.title}
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-6)' }}>
        {recommendation.difficulty && <Badge variant={recommendation.difficulty.toLowerCase() as any}>{recommendation.difficulty}</Badge>}
        {recommendation.topicTags?.slice(0, 3).map(tag => (
          <Badge key={tag.name} variant="neutral" style={{ background: 'transparent' }}>{tag.name}</Badge>
        ))}
      </div>

      <div style={{ 
        background: 'var(--bg-tertiary)', 
        padding: 'var(--space-4) var(--space-5)', 
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-8)',
        border: '1px solid var(--border-subtle)'
      }}>
        <p className="label" style={{ fontSize: '10px', marginBottom: 'var(--space-1)' }}>Why this problem?</p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {recommendation.reason || "This problem focuses on BFS traversal which we identified as an area for improvement based on your recent submissions."}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Button 
          size="lg" 
          onClick={() => window.open(`https://leetcode.com/problems/${recommendation.titleSlug}/`, '_blank')}
          style={{ width: '100%' }}
        >
          Start Solving →
        </Button>
        <Button 
          variant="ghost" 
          onClick={onRefresh}
          style={{ width: '100%', fontSize: '13px' }}
        >
          Get another recommendation
        </Button>
      </div>
    </Card>
  );
}
