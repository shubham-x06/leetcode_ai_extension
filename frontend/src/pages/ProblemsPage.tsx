import { useState } from 'react';
import Card from '../components/ui/Card';
import Skeleton from '../components/Skeleton';
import ErrorCard from '../components/ErrorCard';
import EmptyCard from '../components/EmptyCard';
import { useProblems, useDailyProblem } from '../api/problems';

export default function ProblemsPage() {
  const [difficulty, setDifficulty] = useState<string>('');
  const { data: dailyData, isLoading: dailyLoading } = useDailyProblem();
  const { data, isLoading, error, refetch } = useProblems({
    difficulty: difficulty || undefined,
  });

  const problems = data?.problems || [];

  const getDifficultyColor = (diff: string) => {
    const d = diff.toLowerCase();
    if (d.includes('easy')) return 'text-green-600';
    if (d.includes('medium')) return 'text-amber-600';
    if (d.includes('hard')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDifficultyBg = (diff: string) => {
    const d = diff.toLowerCase();
    if (d.includes('easy')) return 'bg-green-100';
    if (d.includes('medium')) return 'bg-amber-100';
    if (d.includes('hard')) return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Problems</h1>

      {/* Daily Problem */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Daily Challenge</h2>
        {dailyLoading ? (
          <Skeleton height={100} />
        ) : dailyData ? (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{(dailyData.problem as any)?.title || 'No daily problem'}</h3>
            <p className="text-gray-600">{(dailyData.problem as any)?.description?.slice(0, 200)}...</p>
          </div>
        ) : (
          <EmptyCard icon="📅" title="No Daily Problem" message="Check back tomorrow!" />
        )}
      </Card>

      {/* Filter */}
      <Card>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Problems List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Problems List</h2>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </div>
        ) : error ? (
          <ErrorCard error="Failed to load problems" onRetry={() => refetch()} />
        ) : problems.length > 0 ? (
          <div className="space-y-4">
            {problems.slice(0, 20).map((problem: any) => (
              <Card key={problem.titleSlug} className="hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{problem.title}</h3>
                    <div className="flex gap-2 flex-wrap">
                      {problem.tags?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyBg(
                        problem.difficulty
                      )} ${getDifficultyColor(problem.difficulty)}`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyCard icon="📚" title="No Problems Found" message="Try adjusting your filters" />
        )}
      </div>
    </div>
  );
}