import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, getStaleMeta } from '../lib/api';
import { StaleBanner } from '../components/StaleBanner';

type HistoryRow = {
  title?: string;
  rank?: number;
  rating?: number;
  date?: string;
};

function extractHistory(root: unknown): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 20 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    if (typeof o.contest === 'object' && o.contest) {
      const c = o.contest as Record<string, unknown>;
      rows.push({
        title: typeof c.title === 'string' ? c.title : undefined,
        rank: typeof o.rank === 'number' ? o.rank : undefined,
        rating:
          typeof o.rating === 'number'
            ? o.rating
            : typeof o.newRating === 'number'
              ? o.newRating
              : undefined,
        date: typeof o.finishTime === 'string' ? o.finishTime : undefined,
      });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(root);
  return rows.filter((r) => r.title || r.rating);
}

export function ContestPage() {
  const contestQ = useQuery({
    queryKey: ['leetcode', 'me', 'contest'],
    queryFn: async () => {
      const res = await api.get('/api/leetcode/me/contest');
      return { body: res.data, stale: getStaleMeta(res.headers) };
    },
  });

  const historyQ = useQuery({
    queryKey: ['leetcode', 'me', 'contest-history'],
    queryFn: async () => {
      const res = await api.get('/api/leetcode/me/contest/history');
      return { body: res.data, stale: getStaleMeta(res.headers) };
    },
  });

  const loading = contestQ.isLoading || historyQ.isLoading;
  const err = (contestQ.error || historyQ.error) as Error & { code?: string } | undefined;

  const rows = useMemo(() => {
    const wrap = historyQ.data?.body as { data?: unknown } | undefined;
    const raw = wrap?.data ?? wrap;
    return extractHistory(raw).slice(0, 80);
  }, [historyQ.data]);

  const chartData = useMemo(
    () =>
      rows
        .map((r, i) => ({
          i,
          rating: typeof r.rating === 'number' ? r.rating : 0,
          label: r.title || `C${i}`,
        }))
        .filter((x) => x.rating > 0),
    [rows]
  );

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-white/5" />;
  }

  if (err?.code === 'NO_LC_USER') {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        Set your LeetCode username in Settings to load contest stats.
      </div>
    );
  }

  if (contestQ.isError || historyQ.isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        {(err as Error).message}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Contest</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No contests yet — when you participate, rating history will show here.
        </p>
      </div>
    );
  }

  const contestWrap = contestQ.data?.body as { data?: unknown } | undefined;
  const contestInner = contestWrap?.data ?? contestWrap;
  const ratingStr = JSON.stringify(contestInner);
  const ratingMatch = ratingStr.match(/"rating"\s*:\s*(\d+)/);
  const rating = ratingMatch ? Number(ratingMatch[1]) : undefined;
  const stale = !!(contestQ.data?.stale.stale || historyQ.data?.stale.stale);

  return (
    <div className="space-y-4">
      <StaleBanner stale={stale} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Current rating</h2>
          <p className="mt-2 text-4xl font-extrabold">{rating ?? '—'}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Numeric rating from synced contest payload.</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Raw contest payload</h2>
          <pre className="mt-2 max-h-48 overflow-auto text-xs text-[var(--muted)]">
            {ratingStr.slice(0, 4000)}
          </pre>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Rating over time</h2>
        {chartData.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Could not chart rating — see history below.</p>
        ) : (
          <div className="mt-2 h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a36" />
                <XAxis dataKey="i" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#7aa2f7" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Contest history</h2>
        <div className="mt-2 max-h-[28rem] space-y-2 overflow-auto text-sm">
          {rows.slice(0, 40).map((r, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 border-b border-[var(--border)] py-2 last:border-0"
            >
              <div>
                <strong>{r.title || 'Contest'}</strong>
                <div className="text-xs text-[var(--muted)]">{r.date || ''}</div>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                rank {r.rank ?? '—'}
                <br />
                rating {r.rating ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
