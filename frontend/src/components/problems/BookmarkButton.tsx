import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addBookmark, removeBookmark } from '../../api/user';
import { Spinner } from '../ui/Spinner';

interface BookmarkButtonProps {
  titleSlug: string;
  title: string;
  difficulty: string;
  isBookmarked: boolean;
  onToggle?: (newState: boolean) => void;
  style?: React.CSSProperties;
}

export function BookmarkButton({ titleSlug, title, difficulty, isBookmarked, onToggle, style }: BookmarkButtonProps) {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: { titleSlug: string; title: string; difficulty: string }) => addBookmark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onToggle?.(true);
    },
    onError: (err) => console.error('[BOOKMARK] Add failed:', err),
  });

  const removeMutation = useMutation({
    mutationFn: (slug: string) => removeBookmark(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onToggle?.(false);
    },
    onError: (err) => console.error('[BOOKMARK] Remove failed:', err),
  });

  const loading = addMutation.isPending || removeMutation.isPending;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isBookmarked) {
      removeMutation.mutate(titleSlug);
    } else {
      addMutation.mutate({ titleSlug, title, difficulty });
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '8px',
        color: isBookmarked ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'transform 0.15s ease, color 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.color = 'var(--accent)'; } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = isBookmarked ? 'var(--accent)' : 'var(--text-muted)'; } }}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill={isBookmarked ? "currentColor" : "none"} 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      )}
    </button>
  );
}
