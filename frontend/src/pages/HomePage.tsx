import { useQuery } from '@tanstack/react-query';
import { api, getStaleMeta } from '../lib/api';
import { StaleBanner } from '../components/StaleBanner';
import {
  extractCalendarMap,
  extractSolvedCounts,
  extractWeakTags,
  streaksFromCalendar,
} from '../lib/stats';
import { useSessionStore } from '../store/sessionStore';

export function HomePage() {
  const user = useSessionStore((s) => s.user);
  const jwt = useSessionStore((s) => s.jwt);

  const statsQ = useQuery({
    queryKey: ['user', 'me', 'stats'],
    enabled: !!jwt,
    queryFn: async () => {
      const res = await api.get<{
        profile: unknown;
        solved: unknown;
        skill: unknown;
        language: unknown;
        meta?: { stale?: boolean; staleReason?: string };
      }>('/api/user/me/stats');
      return { ...res.data, _stale: getStaleMeta(res.headers) };
    },
  });

  const dailyQ = useQuery({
    queryKey: ['leetcode', 'daily'],
    enabled: !!jwt,
    queryFn: async () => {
      const res = await api.get<{ data: unknown; meta?: { stale?: boolean } }>('/api/leetcode/daily');
      return { body: res.data, stale: getStaleMeta(res.headers) };
    },
  });

  const blurbQ = useQuery({
    queryKey: ['ai', 'daily-blurb'],
    enabled: !!jwt && !!user?.leetcodeUsername,
    meta: { silent: true },
    queryFn: async () => {
      const res = await api.post<{ blurb?: string }>('/api/ai/mentor/daily-blurb', {});
      return res.data;
    },
  });

  const dailyGoalQ = useQuery({
    queryKey: ['ai', 'daily-goal'],
    enabled: !!jwt && !!user?.leetcodeUsername,
    meta: { silent: true },
    queryFn: async () => {
      const res = await api.get<unknown>('/api/ai/daily-goal');
      return res.data;
    },
  });

  if (statsQ.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (statsQ.isError) {
    const err = statsQ.error as Error & { code?: string };
    const code = err.code;

    if (code === 'PRIVATE_PROFILE') {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-lg font-semibold">Profile private</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your LeetCode profile must be public for us to read stats. Make it public on LeetCode, then refresh.
          </p>
        </div>
      );
    }

    if (code === 'NO_LC_USER') {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-lg font-semibold">Home</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Add your LeetCode username in Settings to load stats.</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        {(statsQ.error as Error).message}
      </div>
    );
  }

  const solved = statsQ.data?.solved;
  const skill = statsQ.data?.skill;
  const stale = !!(statsQ.data?._stale?.stale || statsQ.data?.meta?.stale || dailyQ.data?.stale.stale);
  const staleReason = statsQ.data?._stale?.staleReason || statsQ.data?.meta?.staleReason;

  const counts = extractSolvedCounts(solved ?? statsQ.data?.profile);
  const calMap = extractCalendarMap(solved ?? statsQ.data?.profile);
  const streaks = streaksFromCalendar(calMap);
  const weak = extractWeakTags(skill, 10);
  const heatValues = Object.values(calMap);
  const maxHeat = heatValues.length ? Math.max(1, ...heatValues) : 1;
  const recentDays = Object.keys(calMap)
    .sort()
    .slice(-120);
  const totalSolved = counts.easy + counts.medium + counts.hard;

  return (
    <div className="space-y-4">
      <StaleBanner stale={stale} reason={staleReason} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Welcome</h2>
          <div className="mt-3 flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-12 w-12 rounded-full" width={48} height={48} />
            ) : null}
            <div>
              <div className="font-semibold">{user?.name || 'Learner'}</div>
              <div className="text-sm text-[var(--muted)]">@{user?.leetcodeUsername || 'set username in Settings'}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Daily goal preview:{' '}
            <span className="text-[var(--text)]">
              {dailyGoalQ.data ? JSON.stringify(dailyGoalQ.data).slice(0, 160) : '—'}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Solved</h2>
          {totalSolved === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No solved counts yet — try the daily or Problems tab.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-8 border-[var(--easy)] text-center text-sm font-semibold">
                E<span className="block text-lg">{counts.easy}</span>
              </div>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-8 border-[var(--medium)] text-center text-sm font-semibold">
                M<span className="block text-lg">{counts.medium}</span>
              </div>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-8 border-[var(--hard)] text-center text-sm font-semibold">
                H<span className="block text-lg">{counts.hard}</span>
              </div>
            </div>
          )}
          <p className="mt-3 text-sm text-[var(--muted)]">
            Current streak: <strong className="text-[var(--text)]">{streaks.current}</strong> · Longest:{' '}
            <strong className="text-[var(--text)]">{streaks.longest}</strong>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Submission heatmap</h2>
        <div className="mt-3 flex max-w-full flex-wrap gap-0.5" aria-label="last 120 days activity">
          {recentDays.map((d) => {
            const c = calMap[d] || 0;
            const level = c <= 0 ? 0 : Math.min(4, Math.ceil((c / maxHeat) * 4));
            const bg =
              level === 0
                ? 'bg-white/10'
                : level === 1
                  ? 'bg-blue-500/30'
                  : level === 2
                    ? 'bg-blue-500/50'
                    : level === 3
                      ? 'bg-blue-500/70'
                      : 'bg-blue-500';
            return <div key={d} title={`${d}: ${c}`} className={`h-2.5 w-2.5 rounded-sm ${bg}`} />;
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Daily problem</h2>
          <pre className="mt-2 max-h-48 overflow-auto text-xs text-[var(--muted)]">
            {JSON.stringify(dailyQ.data?.body ?? dailyQ.data, null, 2).slice(0, 2000)}
          </pre>
          {blurbQ.data?.blurb ? (
            <p className="mt-3 text-sm">{blurbQ.data.blurb}</p>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">AI blurb loads when username + stats sync.</p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Weak topics</h2>
          {weak.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Skill stats appear after profile sync.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1">
              {weak.map((t) => (
                <span key={t} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
