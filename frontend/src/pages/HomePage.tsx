import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useStats } from '../hooks/useStats';
import { useCalendar } from '../hooks/useCalendar';
import { useDailyProblem } from '../hooks/useDailyProblem';
import { useSubmissions } from '../hooks/useSubmissions';

import { WelcomeCard } from '../components/home/WelcomeCard';
import { SolvedRings } from '../components/charts/SolvedRings';
import { CalendarHeatmap } from '../components/charts/CalendarHeatmap';
import { DailyProblemCard } from '../components/home/DailyProblemCard';
import { WeakTopicsBadges } from '../components/home/WeakTopicsBadges';
import { RecentSubmissions } from '../components/home/RecentSubmissions';
import { Skeleton } from '../components/ui/Skeleton';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: calendar, isLoading: calendarLoading } = useCalendar();
  const { data: daily, isLoading: dailyLoading } = useDailyProblem();
  const { data: subs, isLoading: subsLoading } = useSubmissions(5);

  const isLoading = statsLoading && calendarLoading && dailyLoading;

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  const solvedData = stats?.solved || {};
  const welcomeStats = {
    streak: calendar?.streak || 0,
    totalSolved: solvedData.totalSolved || solvedData.solvedProblem || 0,
    globalRank: stats?.profile?.profile?.ranking || stats?.profile?.ranking || stats?.profile?.data?.matchedUser?.profile?.ranking || '—',
  };

  const progress = stats?.progress || {};
  const totalByDiff = progress.totalByDifficulty || [];
  
  const getCount = (diff: string) => totalByDiff.find((q: any) => q.difficulty === diff)?.count || 100;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: 'var(--space-6)',
    }}>
      {/* SECTION 1: Welcome Banner (full width) */}
      <div style={{ gridColumn: 'span 12' }}>
        <WelcomeCard user={user ?? undefined} stats={welcomeStats} />
      </div>

      {/* Left column */}
      <div className="home-col-left" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <SolvedRings 
            delay={100}
            stats={{
              totalSolved: welcomeStats.totalSolved as number,
              easySolved: solvedData.easySolved || 0,
              mediumSolved: solvedData.mediumSolved || 0,
              hardSolved: solvedData.hardSolved || 0,
              totalEasy: getCount('Easy'),
              totalMedium: getCount('Medium'),
              totalHard: getCount('Hard'),
            }} 
          />
          
          {/* SECTION 3: Submission Calendar Heatmap (full width in left col) */}
          <CalendarHeatmap delay={200} data={calendar} />
          
          {/* SECTION 6: Recent Submissions */}
          <RecentSubmissions delay={300} submissions={subs?.submissions || []} />
      </div>

      {/* Right Column (Daily + Weak Topics) */}
      <div className="home-col-right" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* SECTION 4: Daily Problem Card */}
          <DailyProblemCard 
            delay={150} 
            problem={daily?.problem} 
            motivation="Consistency is key. Mastering this pattern will help you tackle Medium-level Array problems with ease."
          />
          
          {/* SECTION 5: Weak Topics */}
          <WeakTopicsBadges 
            delay={250} 
            topics={stats?.weakTopics || ((user as any)?.cachedWeakTopics || ['Dynamic Programming', 'Graphs', 'Trie'])} 
          />
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .home-col-left { grid-column: span 8; }
          .home-col-right { grid-column: span 4; }
        }
        @media (max-width: 1023px) {
          .home-col-left, .home-col-right { grid-column: span 12; }
        }
      `}</style>
    </div>
  );
}

function HomePageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Skeleton height={140} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-6)' }}>
        <div style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <Skeleton height={280} />
            <Skeleton height={180} />
          </div>
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <Skeleton height={480} />
        </div>
      </div>
    </div>
  );
}
