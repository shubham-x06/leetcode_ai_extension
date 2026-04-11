import { extractLanguageSplit, extractRadarTopics } from '../lib/stats';
import { useStats } from '../hooks/useStats';
import { useSubmissions } from '../hooks/useSubmissions';
import { SkillRadar } from '../components/charts/SkillRadar';
import { LanguagePie } from '../components/charts/LanguagePie';

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
  const statsQ = useStats();
  const subsQ = useSubmissions(10);

  const loading = statsQ.isLoading || subsQ.isLoading;
  const firstErr = (statsQ.error || subsQ.error) as (Error & { code?: string }) | undefined;

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

  const stats = statsQ.data;
  const skillRoot = stats?.skills;
  const langRoot = stats?.languages;
  const submissionsWrap = subsQ.data?.submissions ?? subsQ.data;
  const subRows = Array.isArray(submissionsWrap) ? extractSubs(submissionsWrap) : extractSubs(submissionsWrap);

  const radarData = extractRadarTopics(skillRoot).map((r) => ({
    topic: r.topic.slice(0, 14),
    strength: r.value,
  }));
  const langData = extractLanguageSplit(langRoot);

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
          <SkillRadar data={radarData} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="text-base font-semibold">Languages</h2>
          <LanguagePie data={langData} />
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
