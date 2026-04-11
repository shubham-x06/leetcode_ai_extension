import React from 'react';
import { Button } from '../ui/Button';

interface Filters {
  search: string;
  difficulty: string;
  tags: string;
}

interface ProblemFiltersProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  resultsCount?: number;
}

export function ProblemFilters({ filters, setFilters, resultsCount = 0 }: ProblemFiltersProps) {
  const hasActiveFilters = filters.search || filters.difficulty || filters.tags;

  const clearFilters = () => {
    setFilters({ search: '', difficulty: '', tags: '' });
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-3)',
      alignItems: 'center',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4) var(--space-5)',
      marginBottom: 'var(--space-6)',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
        <div style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search problems..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Difficulty */}
      <select
        value={filters.difficulty}
        onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
        style={{ ...inputStyle, width: '160px', paddingLeft: '12px', paddingRight: '32px', cursor: 'pointer' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <option value="">All Difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      {/* Tags */}
      <div style={{ position: 'relative', width: '240px' }}>
        <input
          type="text"
          placeholder="Filter by topic (e.g. array, dp)"
          value={filters.tags}
          onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
          style={{ ...inputStyle, paddingLeft: '12px' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: 'var(--accent)' }}>
          Clear All
        </Button>
      )}

      {/* Count */}
      <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
        Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{resultsCount}</span> problems
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px 10px 40px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'var(--transition-fast)',
  width: '100%',
};
