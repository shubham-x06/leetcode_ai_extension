import { useQueries } from '@tanstack/react-query';
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { api } from '../lib/api';
import { extractLanguageSplit, extractRadarTopics } from '../lib/stats';

const PIE_COLORS = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e', '#bb9af7', '#7dcfff'];

type SubRow = { title?: string; timestamp?: string; lang?: string };

function extractSubs(root: unknown): SubRow[] {
  const rows: SubRow[] = [];
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 18 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    if (typeof o.title === 'string' && (o.timestamp || o.statusDisplay)) {
      rows.push({
        title: o.title,
        timestamp: String(o.timestamp || o.date || ''),
        lang: typeof o.lang === 'string' ? o.lang : typeof o.language === 'string' ? o.language : undefined,
      });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(root);
  return rows.slice(0, 10);
}

export function ProgressPage() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['user', 'stats'],
        queryFn: async () => {
          const res = await api.get('/api/user/stats');
          return res.data;
        },
      },
      {
        queryKey: ['user', 'submissions'],
        queryFn: async () => {
          const res = await api.get('/api/user/submissions?limit=10');
          return res.data;
        },
      },
    ],
  });

  const [statsQ, subsQ] = results;
  const loading = results.some((r) => r.isLoading);
  const firstErr = results.find((r) => r.isError)?.error as (Error & { code?: string }) | undefined;

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-white/5" />;
  }

  if (firstErr?.code === 'NO_LC_USER') {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        Set your LeetCode username in Settings.
      </div>
    );
  }

  if (firstErr) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        {firstErr.message}
      </div>
    );
  }

  const stats = statsQ.data as { skills?: unknown; languages?: unknown } | undefined;
  const skillRoot = stats?.skills;
  const langRoot = stats?.languages;
  const submissionsWrap = subsQ.data as { submissions?: unknown[] } | undefined;
  const subsRoot = submissionsWrap?.submissions ?? subsQ.data;

  const radarData = extractRadarTopics(skillRoot).map((r) => ({
    topic: r.topic.slice(0, 14),
    strength: r.value,
  }));
  const langData = extractLanguageSplit(langRoot);
  const subRows = Array.isArray(subsRoot) ? extractSubs(subsRoot) : extractSubs(subsRoot);

  return (
    <div className="space-y-4">
      {radarData.length === 0 && langData.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
          Solve a few problems with a public profile to unlock radar and language charts.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Skill radar</h2>
          {radarData.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No skill buckets detected yet.</p>
          ) : (
            <div className="mt-2 h-72 w-full">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic" />
                  <Radar name="Strength" dataKey="strength" stroke="#7aa2f7" fill="#7aa2f7" fillOpacity={0.35} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Languages</h2>
          {langData.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No language stats yet.</p>
          ) : (
            <div className="mt-2 h-72 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={langData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {langData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Recent accepted submissions</h2>
        {subRows.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No recent AC submissions found.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {subRows.map((s, i) => (
              <li key={i}>
                <strong>{s.title || 'Problem'}</strong>{' '}
                <span className="text-[var(--muted)]">
                  {s.lang || ''} {s.timestamp ? `· ${s.timestamp}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
