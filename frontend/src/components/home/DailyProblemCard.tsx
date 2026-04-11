import React from 'react';
import { Badge } from '../ui/Badge';

interface Problem {
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  content?: string;
}

export function DailyProblemCard({ problem }: { problem?: Problem }) {
  if (!problem) return null;
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Problem of the Day</p>
      <div className="flex items-center gap-2">
        <a
          href={`https://leetcode.com/problems/${problem.titleSlug}/`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {problem.title}
        </a>
        {problem.difficulty && <Badge variant={problem.difficulty as any}>{problem.difficulty}</Badge>}
      </div>
    </div>
  );
}
