import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ApiError, apiFetch } from '../lib/api';
import { StaleBanner } from '../components/StaleBanner';

type HistoryRow = {
  title?: string;
  rank?: number;
  rating?: number;
  trendDirection?: string;
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
        rating: typeof o.rating === 'number' ? o.rating : typeof o.newRating === 'number' ? o.newRating : undefined,
        trendDirection: typeof o.trendDirection === 'string' ? o.trendDirection : undefined,
        date: typeof o.finishTime === 'string' ? o.finishTime : undefined,
      });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(root);
  return rows.filter((r) => r.title || r.rating);
}

export function ContestPage() {
  const [contest, setContest] = useState<unknown>(null);
  const [history, setHistory] = useState<unknown>(null);
  const [meta, setMeta] = useState<{ stale?: boolean; staleReason?: string }>({});
  const [err, setErr] = useState<string | null>(null);
  const [noUser, setNoUser] = useState(false);

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const [c, h] = await Promise.all([
          apiFetch<unknown>('/api/leetcode/me/contest'),
          apiFetch<unknown>('/api/leetcode/me/contest/history'),
        ]);
        setContest(c.data);
        setHistory(h.data);
        setMeta({ stale: !!(c.meta.stale || h.meta.stale), staleReason: c.meta.staleReason });
      } catch (e) {
        if (e instanceof ApiError && e.code === 'NO_LC_USER') {
          setNoUser(true);
          return;
        }
        setErr(e instanceof Error ? e.message : 'Failed to load contests');
      }
    })();
  }, []);

  const rows = useMemo(() => extractHistory(history).slice(0, 80), [history]);
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

  const ratingStr = JSON.stringify(contest);
  const ratingMatch = ratingStr.match(/"rating"\s*:\s*(\d+)/);
  const rating = ratingMatch ? Number(ratingMatch[1]) : undefined;

  if (noUser) {
    return (
      <div className="card">
        <h2>Contest</h2>
        <p className="muted">Set your LeetCode username in Settings to load contest stats.</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="card">
        <h2>Contest</h2>
        <div className="banner error">{err}</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card">
        <h2>Contest</h2>
        <p>No contests yet — when you participate, rating history and tables will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <StaleBanner meta={meta} />
      <div className="grid-2">
        <div className="card">
          <h2>Current rating</h2>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{rating ?? '—'}</p>
          <p className="muted">Tier badges use LeetCode&apos;s contest tiers; we show your numeric rating from synced data.</p>
        </div>
        <div className="card">
          <h2>Top %</h2>
          <p className="muted">Global rank and percentile are available on your LeetCode profile; contest payload below includes contest-specific ranks.</p>
          <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', maxHeight: 200, overflow: 'auto' }}>
            {JSON.stringify(contest, null, 2).slice(0, 4000)}
          </pre>
        </div>
      </div>
      <div className="card">
        <h2>Rating over time</h2>
        {chartData.length === 0 ? (
          <p className="muted">Could not chart rating — raw history is still listed below.</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
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
      <div className="card">
        <h2>Contest history</h2>
        <div className="problem-list">
          {rows.slice(0, 40).map((r, i) => (
            <div key={i} className="problem-row">
              <div>
                <strong>{r.title || 'Contest'}</strong>
                <div className="muted">{r.date || ''}</div>
              </div>
              <div className="muted" style={{ textAlign: 'right' }}>
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
