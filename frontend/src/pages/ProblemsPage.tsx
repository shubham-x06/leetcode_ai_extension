import React, { useState } from 'react';
import { getProblemList } from '../api/problems';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { ProblemFilters } from '../components/problems/ProblemFilters';
import { ProblemCard } from '../components/problems/ProblemCard';
import { Spinner } from '../components/ui/Spinner';

interface Filters {
  search: string;
  difficulty: string;
  tags: string;
}

export default function ProblemsPage() {
  const token = useAuthStore((s) => s.token);
  const [filters, setFilters] = useState<Filters>({ search: '', difficulty: '', tags: '' });
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['problems', filters, skip],
    enabled: !!token,
    queryFn: () => getProblemList({
      limit,
      skip,
      search: filters.search || undefined,
      difficulty: filters.difficulty || undefined,
      tags: filters.tags || undefined,
    }),
    staleTime: 120_000,
  });

  const problems: any[] = data?.problems || [];

  return (
    <div>
      <ProblemFilters
        filters={filters}
        setFilters={(f) => { setFilters(f); setSkip(0); }}
      />
      <div className="p-4">
        {(isLoading || isFetching) && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
        {!isLoading && problems.map((p: any) => (
          <ProblemCard key={p.titleSlug} problem={p} />
        ))}
        {!isLoading && problems.length === 0 && (
          <p className="text-center text-gray-400 py-8">No problems found.</p>
        )}
        <div className="flex justify-between mt-4">
          <button
            disabled={skip === 0}
            onClick={() => setSkip(Math.max(0, skip - limit))}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            disabled={problems.length < limit}
            onClick={() => setSkip(skip + limit)}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
