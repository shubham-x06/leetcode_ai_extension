import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { getDailyProblem } from '../api/problems';
import { getUserCalendar } from '../api/user';
import { WelcomeCard } from '../components/home/WelcomeCard';
import { DailyProblemCard } from '../components/home/DailyProblemCard';
import { StreakCard } from '../components/home/StreakCard';
import { WeakTopicsBadges } from '../components/home/WeakTopicsBadges';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const { data: calendarData } = useQuery({
    queryKey: ['calendar'],
    enabled: !!token,
    queryFn: () => getUserCalendar(),
    staleTime: 300_000,
  });

  const { data: dailyData } = useQuery({
    queryKey: ['daily'],
    enabled: !!token,
    queryFn: getDailyProblem,
    staleTime: 3_600_000,
  });

  return (
    <div className="space-y-4">
      <WelcomeCard user={user ?? undefined} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {calendarData && (
          <StreakCard
            streak={calendarData.streak}
            longestStreak={calendarData.longestStreak}
            totalActiveDays={calendarData.totalActiveDays}
          />
        )}
        {dailyData?.problem && <DailyProblemCard problem={dailyData.problem} />}
      </div>
      {user && (
        <WeakTopicsBadges topics={(user as any).cachedWeakTopics || []} />
      )}
    </div>
  );
}
