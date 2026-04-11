import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Problem {
  title: string;
  titleSlug: string;
  difficulty: string;
}

interface DailyGoalCardProps {
  motivation?: string;
  problems?: Problem[];
  isLoading?: boolean;
}

export function DailyGoalCard({ motivation, problems = [], isLoading }: DailyGoalCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-gray-400">Loading daily goal...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Goal 🎯</CardTitle>
      </CardHeader>
      <CardContent>
        {motivation && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{motivation}</p>
        )}
        <div className="space-y-2">
          {problems.map((p) => (
            <a
              key={p.titleSlug}
              href={`https://leetcode.com/problems/${p.titleSlug}/`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-colors"
            >
              <span className="text-sm font-medium dark:text-gray-100">{p.title}</span>
              <Badge variant={p.difficulty as any}>{p.difficulty}</Badge>
            </a>
          ))}
          {problems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No problems assigned yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
