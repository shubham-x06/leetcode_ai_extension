import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProblemList } from '../api/problems';
import { useUser } from '../hooks/useUser';
import { ProblemFilters } from '../components/problems/ProblemFilters';
import { ProblemCard } from '../components/problems/ProblemCard';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

interface Filters {
  search: string;
  difficulty: string;
  tags: string;
}

export default function ProblemsPage() {
  const [filters, setFilters] = useState<Filters>({ search: '', difficulty: '', tags: '' });
  const [skip, setSkip] = useState(0);
  const [isBookmarksExpanded, setIsBookmarksExpanded] = useState(false);
  const limit = 20;

  const { data: userData } = useUser();
  const bookmarkedSlugs = new Set(userData?.bookmarkedProblems?.map((b: any) => b.titleSlug) || []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['problems', filters, skip],
    queryFn: () => getProblemList({
      limit,
      skip,
      search: filters.search || undefined,
      difficulty: filters.difficulty || undefined,
      tags: filters.tags || undefined,
    }),
    staleTime: 120_000,
  });

  const problems = data?.questions || data?.problems || [];
  const total = data?.total || 0;

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setSkip(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Filter Bar */}
      <ProblemFilters 
        filters={filters} 
        setFilters={handleFilterChange} 
        resultsCount={total}
      />

      {/* Bookmarks Section (Collapsible) */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => setIsBookmarksExpanded(!isBookmarksExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
              Bookmarked Problems ({bookmarkedSlugs.size})
            </span>
          </div>
          <svg 
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isBookmarksExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {isBookmarksExpanded && (
          <div style={{ 
            marginTop: 'var(--space-4)', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 'var(--space-4)',
            animation: 'pageEnter 0.3s ease-out'
          }}>
            {userData?.bookmarkedProblems?.length > 0 ? (
              userData.bookmarkedProblems.map((p: any, i: number) => (
                <ProblemCard 
                  key={p.titleSlug} 
                  problem={p} 
                  isBookmarked={true}
                  delay={i * 50} 
                />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                <EmptyState title="No bookmarks yet" description="Click the star icon on any problem to save it for later." />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Problem List */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} height={180} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {problems.map((p: any, i: number) => (
            <ProblemCard 
              key={p.titleSlug} 
              problem={p} 
              isBookmarked={bookmarkedSlugs.has(p.titleSlug)}
              delay={i * 50}
            />
          ))}
          {problems.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 'var(--space-12)' }}>
              <EmptyState title="No problems found" description="Try adjusting your filters or search term." />
            </div>
          )}
        </div>
      )}

      {/* Load More */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-10)' }}>
        <Button 
          variant="ghost" 
          disabled={isFetching || problems.length < limit}
          onClick={() => setSkip(skip + limit)}
          style={{ gap: 10, border: '1px solid var(--border-default)' }}
        >
          {isFetching ? 'Loading...' : 'Load more problems'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
