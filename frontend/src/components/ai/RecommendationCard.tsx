import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Recommendation {
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  reason?: string;
}

export function RecommendationCard({ recommendation, isLoading }: { recommendation?: Recommendation; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="h-16 flex items-center justify-center text-gray-400">Getting recommendation...</div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Next 💡</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <a
              href={`https://leetcode.com/problems/${recommendation.titleSlug}/`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {recommendation.title}
            </a>
            {recommendation.reason && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{recommendation.reason}</p>
            )}
          </div>
          {recommendation.difficulty && (
            <Badge variant={recommendation.difficulty as any}>{recommendation.difficulty}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
