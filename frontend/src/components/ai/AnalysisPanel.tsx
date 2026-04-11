import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface Analysis {
  timeComplexity?: string;
  spaceComplexity?: string;
  alternativeApproaches?: string[];
  topicReinforced?: string;
  improvementTips?: string[];
}

export function AnalysisPanel({ analysis, isLoading }: { analysis?: Analysis; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-gray-400">Analyzing code...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Analysis 🔍</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">{analysis.timeComplexity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Space</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">{analysis.spaceComplexity}</p>
          </div>
        </div>
        {analysis.topicReinforced && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Topic Reinforced</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{analysis.topicReinforced}</p>
          </div>
        )}
        {analysis.improvementTips && analysis.improvementTips.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Tips</p>
            <ul className="space-y-1">
              {analysis.improvementTips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                  <span className="text-blue-500">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.alternativeApproaches && analysis.alternativeApproaches.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Alternatives</p>
            <ul className="space-y-1">
              {analysis.alternativeApproaches.map((a, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                  <span className="text-purple-500">→</span> {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
