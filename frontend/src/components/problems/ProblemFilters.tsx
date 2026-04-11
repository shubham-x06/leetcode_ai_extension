import React from 'react';

interface Filters {
  search: string;
  difficulty: string;
  tags: string;
}

interface ProblemFiltersProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
}

export function ProblemFilters({ filters, setFilters }: ProblemFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-950">
      <input
        placeholder="Search problems..."
        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />
      <select
        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
        value={filters.difficulty}
        onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
      >
        <option value="">All Difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>
      <input
        placeholder="Tag (e.g. array, dp)"
        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
        value={filters.tags}
        onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
      />
    </div>
  );
}
