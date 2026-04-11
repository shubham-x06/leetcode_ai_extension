import React from 'react';
import { addBookmark, removeBookmark } from '../../api/user';

interface BookmarkButtonProps {
  titleSlug: string;
  title: string;
  difficulty: string;
  isBookmarked: boolean;
  onToggle?: (newState: boolean) => void;
}

export function BookmarkButton({ titleSlug, title, difficulty, isBookmarked, onToggle }: BookmarkButtonProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(titleSlug);
        onToggle?.(false);
      } else {
        await addBookmark({ titleSlug, title, difficulty });
        onToggle?.(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={`transition-colors text-lg ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
    >
      {isBookmarked ? '★' : '☆'}
    </button>
  );
}
