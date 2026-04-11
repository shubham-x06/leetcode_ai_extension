import React from 'react';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

interface ProblemCardProps {
  problem: {
    title: string;
    titleSlug: string;
    difficulty: string;
    acRate?: number;
  };
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function ProblemCard({ problem, onBookmark, isBookmarked }: ProblemCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-2 hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-800 transition-colors">
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-900 dark:text-gray-100">{problem.title}</span>
        <Badge variant={problem.difficulty as any}>{problem.difficulty}</Badge>
        {problem.acRate !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {(problem.acRate * 100).toFixed(1)}% AC
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`https://leetcode.com/problems/${problem.titleSlug}/`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-500 hover:underline"
        >
          Solve →
        </a>
        {onBookmark && (
          <button
            onClick={onBookmark}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              isBookmarked
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        )}
      </div>
    </div>
  );
}
