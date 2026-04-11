import React from 'react';
import { useStats } from '../hooks/useStats';
import { useSubmissions } from '../hooks/useSubmissions';
import { SkillRadar } from '../components/charts/SkillRadar';
import { LanguagePie } from '../components/charts/LanguagePie';
import { StatCard } from '../components/home/StatCard';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';

export default function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: subsData, isLoading: subsLoading } = useSubmissions(20);

  if (statsLoading) {
    return <ProgressPageSkeleton />;
  }

  const skills = [...(stats?.skills?.advanced || []), ...(stats?.skills?.intermediate || []), ...(stats?.skills?.fundamental || [])];
  const languages = stats?.languages?.languageProblemCount || stats?.languages || [];
  const submissions = subsData?.submissions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Section: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-6)' }}>
        <div style={{ gridColumn: 'span 12', lg: 'span 7' } as any}>
          <SkillRadar skills={skills} delay={100} />
        </div>
        <div style={{ gridColumn: 'span 12', lg: 'span 5' } as any}>
          <LanguagePie data={languages} delay={200} />
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
        <StatCard 
          label="Beat (Speed)" 
          value="84.2%" 
          sub="faster than others" 
          accent 
          delay={300} 
        />
        <StatCard 
          label="Acceptance Rate" 
          value="62.5%" 
          sub="avg. success rate" 
          delay={400} 
        />
        <StatCard 
          label="Attempted" 
          value={stats?.solved?.totalSolved + 12 || 142} 
          sub="including non-accepted" 
          delay={500} 
        />
      </div>

      {/* Submissions Feed */}
      <Card delay={600}>
        <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Submission History</h3>
        
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Problem</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Language</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)' }}>Status</th>
                <th className="label" style={{ padding: 'var(--space-4) var(--space-2)', textAlign: 'right' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub: any, i: number) => (
                <tr 
                  key={i} 
                  style={{ 
                    fontSize: '14px', 
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => window.open(`https://leetcode.com/problems/${sub.titleSlug}/`, '_blank')}
                >
                  <td style={{ padding: 'var(--space-4) var(--space-2)', fontWeight: 500, color: 'var(--text-primary)' }}>{sub.title}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-2)' }}>
                    <Badge variant="neutral" style={{ background: 'transparent', border: '1px solid var(--border-default)' }}>{sub.lang}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-2)' }}>
                    <Badge variant={sub.statusDisplay === 'Accepted' ? 'success' : 'error'}>{sub.statusDisplay}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-2)', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {formatDate(sub.timestamp)}
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && !subsLoading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <p className="caption">No submissions found yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--accent)', 
            fontSize: '14px', 
            fontWeight: 600, 
            cursor: 'not-allowed',
            opacity: 0.5
          }}>
            Load more history (Coming Soon)
          </button>
        </div>
      </Card>

      <style>{`
        @media (max-width: 1023px) {
          table { width: 600px; }
        }
      `}</style>
    </div>
  );
}

function formatDate(timestamp: string) {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProgressPageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
        <Skeleton height={300} />
        <Skeleton height={300} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </div>
      <Skeleton height={500} />
    </div>
  );
}
