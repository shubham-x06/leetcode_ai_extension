import { useEffect, useState } from 'react';
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
import { ApiError, apiFetch } from '../lib/api';
import { StaleBanner } from '../components/StaleBanner';
import { extractLanguageSplit, extractRadarTopics } from '../lib/stats';

const PIE_COLORS = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e', '#bb9af7', '#7dcfff'];

export function ProgressPage() {
  const [skill, setSkill] = useState<unknown>(null);
  const [lang, setLang] = useState<unknown>(null);
  const [subs, setSubs] = useState<unknown>(null);
  const [progress, setProgress] = useState<unknown>(null);
  const [meta, setMeta] = useState<{ stale?: boolean; staleReason?: string }>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const [sk, lg, ac, pr] = await Promise.all([
          apiFetch<unknown>('/api/leetcode/me/skill'),
          apiFetch<unknown>('/api/leetcode/me/language'),
          apiFetch<unknown>('/api/leetcode/me/ac-submissions?limit=10'),
          apiFetch<unknown>('/api/leetcode/me/progress'),
        ]);
        setSkill(sk.data);
        setLang(lg.data);
        setSubs(ac.data);
        setProgress(pr.data);
        setMeta({
          stale: !!(sk.meta.stale || lg.meta.stale || ac.meta.stale || pr.meta.stale),
          staleReason: sk.meta.staleReason,
        });
      } catch (e) {
        if (e instanceof ApiError && e.code === 'NO_LC_USER') {
          setErr('Set your LeetCode username in Settings.');
          return;
        }
        setErr(e instanceof Error ? e.message : 'Failed to load progress');
      }
    })();
  }, []);

  const radarData = extractRadarTopics(skill).map((r) => ({
    topic: r.topic.slice(0, 14),
    strength: r.value,
  }));
  const langData = extractLanguageSplit(lang);
  const acceptStr = JSON.stringify(progress).toLowerCase();
  const beatMatch = acceptStr.match(/beat[\s_-]?(\d+\.?\d*)%?/);
  const beat = beatMatch ? `${beatMatch[1]}%` : '—';

  type SubRow = { title?: string; titleSlug?: string; timestamp?: string; lang?: string };

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
          titleSlug: typeof o.titleSlug === 'string' ? o.titleSlug : undefined,
          timestamp: String(o.timestamp || o.date || ''),
          lang: typeof o.lang === 'string' ? o.lang : typeof o.language === 'string' ? o.language : undefined,
        });
      }
      for (const v of Object.values(o)) visit(v, depth + 1);
    };
    visit(root);
    return rows.slice(0, 10);
  }

  const subRows = extractSubs(subs);

  if (err) {
    return (
      <div className="card">
        <h2>Progress</h2>
        <div className="banner error">{err}</div>
      </div>
    );
  }

  return (
    <div>
      <StaleBanner meta={meta} />
      {radarData.length === 0 && langData.length === 0 ? (
        <div className="card">
          <h2>Getting started</h2>
          <p className="muted">Solve a few problems with a public profile to unlock radar and language charts.</p>
        </div>
      ) : null}
      <div className="grid-2">
        <div className="card">
          <h2>Skill radar</h2>
          {radarData.length === 0 ? (
            <p className="muted">No skill buckets detected yet.</p>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
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
        <div className="card">
          <h2>Languages</h2>
          {langData.length === 0 ? (
            <p className="muted">No language stats yet.</p>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
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
      <div className="card">
        <h2>Beat % vs global</h2>
        <p>
          Acceptance snapshot (heuristic parse): <strong>{beat}</strong>
        </p>
        <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', maxHeight: 160, overflow: 'auto' }}>
          {JSON.stringify(progress, null, 2).slice(0, 4000)}
        </pre>
      </div>
      <div className="card">
        <h2>Recent accepted submissions</h2>
        {subRows.length === 0 ? (
          <p className="muted">No recent AC submissions found.</p>
        ) : (
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {subRows.map((s, i) => (
              <li key={i} style={{ marginBottom: '0.35rem' }}>
                <strong>{s.title || 'Problem'}</strong>{' '}
                <span className="muted">
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
