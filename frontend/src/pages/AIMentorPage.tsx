import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { getDailyGoal, getRecommendation, analyzeCode } from '../api/ai';
import { DailyGoalCard } from '../components/ai/DailyGoalCard';
import { RecommendationCard } from '../components/ai/RecommendationCard';
import { AnalysisPanel } from '../components/ai/AnalysisPanel';
import { Button } from '../components/ui/Button';

export default function AIMentorPage() {
  const token = useAuthStore((s) => s.token);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState('');
  const [lang, setLang] = useState('Python');

  const { data: goalData, isLoading: goalLoading } = useQuery({
    queryKey: ['dailyGoal'],
    enabled: !!token,
    queryFn: getDailyGoal,
    staleTime: 3_600_000,
  });

  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['recommend'],
    enabled: !!token,
    queryFn: getRecommendation,
    staleTime: 3_600_000,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeCode(problem, code, lang),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">AI Mentor</h1>

      <DailyGoalCard
        motivation={goalData?.motivation}
        problems={goalData?.problems}
        isLoading={goalLoading}
      />

      <RecommendationCard
        recommendation={recData?.recommendation}
        isLoading={recLoading}
      />

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold dark:text-white">Analyze Your Code</h2>
        <input
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:text-gray-100"
          placeholder="Problem description..."
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
        />
        <textarea
          rows={6}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm font-mono dark:bg-gray-900 dark:text-gray-100"
          placeholder="Paste your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <div className="flex gap-3 items-center">
          <select
            className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:text-gray-100"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending || !code || !problem}
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
        {analyzeMutation.data && <AnalysisPanel analysis={analyzeMutation.data} />}
      </div>
    </div>
  );
}
