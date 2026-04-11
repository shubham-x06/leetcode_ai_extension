import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Submission {
  title: string;
  titleSlug: string;
  lang: string;
  timestamp: string;
  statusDisplay: string;
}

interface RecentSubmissionsProps {
  submissions?: Submission[];
  delay?: number;
}

export function RecentSubmissions({ submissions = [], delay = 0 }: RecentSubmissionsProps) {
  return (
    <Card delay={delay}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h3 className="h3">Recent Accepted</h3>
        <Badge variant="success">Latest</Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {submissions.length === 0 ? (
          <p className="caption" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>No recent submissions found.</p>
        ) : (
          submissions.slice(0, 5).map((sub, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: 'var(--space-4) 0',
                borderBottom: i === submissions.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                transition: 'background var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => window.open(`https://leetcode.com/problems/${sub.titleSlug}/`, '_blank')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.title}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Badge variant="neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>Array</Badge>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexShrink: 0 }}>
                <Badge variant="neutral" style={{ background: 'transparent', border: '1px solid var(--border-default)', fontSize: '11px' }}>
                  {sub.lang}
                </Badge>
                <span className="caption" style={{ fontSize: '12px', minWidth: 60, textAlign: 'right' }}>
                  {formatTime(sub.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 'var(--space-4)', textAlign: 'right' }}>
        <button 
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          View all →
        </button>
      </div>
    </Card>
  );
}

function formatTime(timestamp: string) {
  const date = new Date(parseInt(timestamp) * 1000);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(date.getTime())) return 'recently';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
