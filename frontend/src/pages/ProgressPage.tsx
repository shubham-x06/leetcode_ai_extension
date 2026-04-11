import Card from '../components/ui/Card';
import Skeleton from '../components/Skeleton';
import ErrorCard from '../components/ErrorCard';
import EmptyCard from '../components/EmptyCard';
import LanguagePie from '../components/charts/LanguagePie';
import SkillRadar from '../components/charts/SkillRadar';
import { useUserStats } from '../api/user';

export default function ProgressPage() {
  const { data: stats, isLoading, error, refetch } = useUserStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height={300} />
        <Skeleton height={300} />
      </div>
    );
  }

  if (error) {
    return <ErrorCard error="Failed to load progress data" onRetry={() => refetch()} />;
  }

  // Extract language data
  const languageData = (() => {
    const langs = (stats?.languages as any)?.languageList || [];
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c'];
    return langs
      .slice(0, 5)
      .map((lang: any, idx: number) => ({
        name: lang.name || 'Unknown',
        value: lang.problemsSolved || 0,
        color: colors[idx % colors.length],
      }))
      .filter((l: any) => l.value > 0);
  })();

  // Extract skill data
  const skillData = (() => {
    const skills = (stats?.skills as any)?.skills || [];
    return skills
      .slice(0, 8)
      .map((skill: any) => ({
        subject: skill.name || 'Unknown',
        A: Math.min(100, (skill.problemsSolved || 0) * 2),
        fullMark: 100,
      }))
      .filter((s: any) => s.A > 0);
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Progress</h1>

      {/* Language Distribution */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Language Distribution</h2>
        {languageData.length > 0 ? (
          <LanguagePie data={languageData} />
        ) : (
          <EmptyCard icon="🗣️" title="No Language Data" message="Complete some problems to see language breakdown" />
        )}
      </Card>

      {/* Skill Radar */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Skill Breakdown</h2>
        {skillData.length > 0 ? (
          <SkillRadar data={skillData} />
        ) : (
          <EmptyCard icon="📊" title="No Skill Data" message="Complete some problems to see skill breakdown" />
        )}
      </Card>

      {/* Overall Stats */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">Acceptance Rate</p>
            <p className="text-3xl font-bold text-green-600">
              {((stats?.solved as any)?.acceptanceRate ?? 0).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Problems Solved</p>
            <p className="text-3xl font-bold text-indigo-600">
              {(stats?.solved as any)?.solvedProblem ?? 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}