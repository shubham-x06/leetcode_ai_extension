import React from 'react';
import { useContest } from '../hooks/useContest';
import { StatCard } from '../components/home/StatCard';
import { RatingLine } from '../components/charts/RatingLine';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

export default function ContestPage() {
  const { data, isLoading } = useContest();

  if (isLoading) {
    return <ContestPageSkeleton />;
  }

  const details = data?.contestDetails || {};
  const history = data?.contestHistory || [];

  const rating = details.contestRating ?? details.rating ?? 0;
  const globalRank = details.contestGlobalRanking ?? details.globalRanking ?? 0;
  const topPercentage = details.contestTopPercentage ?? details.topPercentage ?? 0;
  const attended = history.length;

  if (attended === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <h2 className="h2">Contest Performance</h2>
        <Card variant="default" style={{ padding: 'var(--space-12)' }}>
          <EmptyState 
            title="No contests yet" 
            description="Weekly contests run every Sunday at 8AM IST. Join one to see your rating growth!"
            action={
              <Button onClick={() => window.open('https://leetcode.com/contest/', '_blank')}>
                LeetCode Contests →
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Contest Stats Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
        <StatCard 
          label="Current Rating" 
          value={Math.round(rating)} 
          accent 
          delay={0} 
        />
        <StatCard 
          label="Global Rank" 
          value={globalRank ? `#${Number(globalRank).toLocaleString()}` : '—'} 
          delay={100} 
        />
        <StatCard 
          label="Top Percentile" 
          value={topPercentage ? `${Number(topPercentage).toFixed(1)}%` : '—'} 
          delay={200} 
        />
        <StatCard 
          label="Contests Entered" 
          value={attended} 
          delay={300} 
        />
      </div>

      {/* Rating History Chart */}
      <div style={{ width: '100%' }}>
        <RatingLine history={history} delay={400} />
      </div>

      {/* Contest History Table */}
      <Card delay={500}>
        <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Contest History</h3>
        
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Contest Name</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Date</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Rank</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Solved</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)', textAlign: 'right' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().map((c: any, i: number) => {
                const diff = i < history.length - 1 ? Math.round(c.rating - history[history.length - 1 - (i + 1)].rating) : 0;
                return (
                  <tr 
                    key={i} 
                    style={{ 
                      fontSize: '14px', 
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                  >
                    <td style={{ padding: 'var(--space-5) var(--space-2)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.contest.title}
                    </td>
                    <td style={{ padding: 'var(--space-5) var(--space-2)', color: 'var(--text-muted)' }}>
                      {new Date(c.contest.startTime * 1000).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 'var(--space-5) var(--space-2)' }}>
                      <Badge variant="neutral">{c.ranking ? `#${c.ranking}` : '—'}</Badge>
                    </td>
                    <td style={{ padding: 'var(--space-5) var(--space-2)' }}>
                      <span style={{ fontWeight: 500 }}>{c.problemsSolved ?? '—'}/4</span>
                    </td>
                    <td style={{ padding: 'var(--space-5) var(--space-2)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(c.rating)}</span>
                        {diff !== 0 && (
                          <span style={{ fontSize: '11px', color: diff > 0 ? 'var(--success)' : 'var(--error)' }}>
                            {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <style>{`
        @media (max-width: 1023px) {
          table { width: 700px; }
        }
      `}</style>
    </div>
  );
}

function ContestPageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </div>
      <Skeleton height={350} />
      <Skeleton height={500} />
    </div>
  );
}
