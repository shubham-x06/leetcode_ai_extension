import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BookmarkButton } from './BookmarkButton';

interface ProblemCardProps {
  problem: {
    title: string;
    titleSlug: string;
    difficulty: string;
    acRate?: number;
    topicTags?: { name: string }[];
  };
  isBookmarked: boolean;
  onBookmarkToggle?: (newState: boolean) => void;
  delay?: number;
}

export function ProblemCard({ problem, isBookmarked, onBookmarkToggle, delay = 0 }: ProblemCardProps) {
  // Use real topic tags if available, otherwise mocked for design
  const tags = problem.topicTags?.slice(0, 3) || [{ name: 'Array' }, { name: 'Math' }];

  const handleClick = () => {
    window.open(`https://leetcode.com/problems/${problem.titleSlug}/`, '_blank');
  };

  return (
    <Card 
      hoverable 
      delay={delay} 
      style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', height: '100%' }}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <Badge variant={problem.difficulty.toLowerCase() as any}>{problem.difficulty}</Badge>
        {problem.acRate !== undefined && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {(problem.acRate).toFixed(1)}% AC
          </span>
        )}
      </div>

      <h3 className="h3" style={{ 
        fontSize: '16px', 
        marginBottom: 'var(--space-4)', 
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        color: 'var(--text-primary)',
        flex: 1
      }}>
        {problem.title}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-6)' }}>
        {tags.map((tag, i) => (
          <Badge key={i} variant="neutral" style={{ fontSize: '10px', padding: '2px 8px' }}>
            {tag.name}
          </Badge>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
        <Button 
          variant="ghost" 
          size="sm" 
          style={{ paddingLeft: 0, color: 'var(--accent)', fontWeight: 600 }}
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
        >
          Solve →
        </Button>
        <BookmarkButton 
          title={problem.title}
          titleSlug={problem.titleSlug}
          difficulty={problem.difficulty}
          isBookmarked={isBookmarked}
          onToggle={onBookmarkToggle}
        />
      </div>
    </Card>
  );
}
