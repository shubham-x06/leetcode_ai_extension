
import Card from '../components/ui/Card';
import Skeleton from '../components/Skeleton';
import ErrorCard from '../components/ErrorCard';
import EmptyCard from '../components/EmptyCard';
import { useUser, useUserStats, useCalendar, useSubmissions } from '../api/user';

export default function HomePage() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useUserStats();
  const { data: calendar, isLoading: calendarLoading, error: calendarError } = useCalendar();
  const { data: submissions, isLoading: submissionsLoading, error: submissionsError } = useSubmissions(5);

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height={100} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || user?.email}!</h1>
          <p className="text-blue-100">LeetCode Username: {user?.leetcodeUsername || 'Not set'}</p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Solved Count */}
        <Card>
          {statsLoading ? (
            <Skeleton height={80} />
          ) : statsError ? (
            <ErrorCard error="Failed to load stats" onRetry={() => refetchStats()} />
          ) : (
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Problems Solved</p>
              <p className="text-3xl font-bold text-indigo-600">
                {(stats?.solved as any)?.solvedProblem ?? 0}
              </p>
            </div>
          )}
        </Card>

        {/* Acceptance Rate */}
        <Card>
          {statsLoading ? (
            <Skeleton height={80} />
          ) : (
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Acceptance Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {((stats?.solved as any)?.acceptanceRate ?? 0).toFixed(1)}%
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Streak Info */}
      <Card>
        {calendarLoading ? (
          <Skeleton height={100} />
        ) : calendarError ? (
          <EmptyCard icon="📅" title="Calendar" message="Connect LeetCode to see your calendar" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-amber-600">{calendar?.streak ?? 0} 🔥</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Longest Streak</p>
              <p className="text-2xl font-bold text-orange-600">{calendar?.longestStreak ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Days</p>
              <p className="text-2xl font-bold text-teal-600">{calendar?.totalActiveDays ?? 0}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Weak Topics */}
      <Card>
        <p className="text-gray-600 text-sm font-medium mb-4">Weak Topics</p>
        {user?.cachedWeakTopics && user.cachedWeakTopics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.cachedWeakTopics.slice(0, 5).map((topic) => (
              <span key={topic} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {topic}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No weak topics yet</p>
        )}
      </Card>

      {/* Recent Submissions */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
        {submissionsLoading ? (
          <Skeleton height={200} />
        ) : submissionsError ? (
          <ErrorCard error="Failed to load submissions" />
        ) : submissions && submissions.length > 0 ? (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div key={sub.titleSlug} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="text-gray-700">{sub.title}</span>
                <span className="text-xs text-gray-500">{sub.lang}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard icon="📝" title="No Submissions" message="You haven't submitted any solutions yet" />
        )}
      </Card>
    </div>
  );
}