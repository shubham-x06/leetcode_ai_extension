import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { getProblemList } from '../../api/problems';

export interface WeakTopic {
  name: string;
  slug: string;
  problemsSolved: number;
  solveRate: number;
}

interface Problem {
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: number;
}

interface TopicProblems {
  pool: Problem[];
  shown: Problem[];
  loading: boolean;
}

interface WeakTopicsProps {
  topics?: WeakTopic[] | string[];
  delay?: number;
}

function pickTwo(pool: Problem[], exclude: Problem[] = []): Problem[] {
  const excludeSlugs = new Set(exclude.map(p => p.titleSlug));
  const candidates = pool.filter(p => !excludeSlugs.has(p.titleSlug));
  if (candidates.length < 2) {
    // fallback: pick from full pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

const DIFF_COLORS: Record<string, string> = {
  Easy: '#00b8a3',
  Medium: '#ffa116',
  Hard: '#ff375f',
};

export function WeakTopicsBadges({ topics = [], delay = 0 }: WeakTopicsProps) {
  const [topicData, setTopicData] = useState<Record<string, TopicProblems>>({});

  // Normalize topics to rich objects
  const normalizedTopics: WeakTopic[] = topics.slice(0, 3).map(t => {
    if (typeof t === 'string') {
      return {
        name: t,
        slug: t.toLowerCase().replace(/\s+/g, '-'),
        problemsSolved: 0,
        solveRate: 5,
      };
    }
    return t as WeakTopic;
  });

  // Fetch problems for each topic on mount
  useEffect(() => {
    normalizedTopics.forEach(topic => {
      if (!topic.slug) return;
      setTopicData(prev => ({
        ...prev,
        [topic.slug]: { pool: [], shown: [], loading: true },
      }));

      getProblemList({ limit: 20, skip: 0, tags: topic.slug })
        .then(res => {
          const questions: Problem[] = (res.questions || res.problems || []).slice(0, 20);
          const shown = pickTwo(questions);
          setTopicData(prev => ({
            ...prev,
            [topic.slug]: { pool: questions, shown, loading: false },
          }));
        })
        .catch(() => {
          setTopicData(prev => ({
            ...prev,
            [topic.slug]: { pool: [], shown: [], loading: false },
          }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(normalizedTopics.map(t => t.slug))]);

  const shuffle = useCallback((slug: string) => {
    setTopicData(prev => {
      const entry = prev[slug];
      if (!entry || entry.pool.length < 2) return prev;
      const newShown = pickTwo(entry.pool, entry.shown);
      return { ...prev, [slug]: { ...entry, shown: newShown } };
    });
  }, []);

  if (!topics || topics.length === 0) return null;

  return (
    <Card delay={delay}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h3 className="h3">Areas to Strengthen</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {normalizedTopics.map(topic => {
          const entry = topicData[topic.slug];
          const loading = entry?.loading ?? true;
          const shown = entry?.shown ?? [];

          return (
            <div key={topic.name}>
              {/* Topic header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {topic.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {topic.problemsSolved > 0
                      ? `${topic.problemsSolved} solved · ${topic.solveRate}%`
                      : `${topic.solveRate}%`}
                  </span>
                  {/* Shuffle button */}
                  <button
                    onClick={() => shuffle(topic.slug)}
                    disabled={loading || !entry?.pool.length}
                    title="Shuffle questions"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: loading ? 'default' : 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                      opacity: loading ? 0.4 : 1,
                      transition: 'color 0.2s, transform 0.3s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                      <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 5, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
                <div style={{
                  width: `${Math.max(topic.solveRate, 3)}%`,
                  height: '100%',
                  background: topic.solveRate < 20 ? 'var(--error)' : topic.solveRate < 50 ? 'var(--warning)' : 'var(--success)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 1s ease-out',
                }} />
              </div>

              {/* Practice problems */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {loading ? (
                  <>
                    <ProblemSkeleton />
                    <ProblemSkeleton />
                  </>
                ) : shown.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No problems found for this topic.</span>
                ) : (
                  shown.map(problem => (
                    <a
                      key={problem.titleSlug}
                      href={`https://leetcode.com/problems/${problem.titleSlug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 10px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        border: '1px solid transparent',
                        transition: 'border-color 0.15s, background 0.15s',
                        gap: '8px',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        {/* External link icon */}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {problem.title}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: DIFF_COLORS[problem.difficulty] || 'var(--text-muted)',
                        flexShrink: 0,
                        letterSpacing: '0.02em',
                      }}>
                        {problem.difficulty}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProblemSkeleton() {
  return (
    <div style={{
      height: 34,
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}
