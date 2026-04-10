import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../lib/api';
import { StaleBanner } from '../components/StaleBanner';
import {
  extractCalendarMap,
  extractSolvedCounts,
  extractWeakTags,
  streaksFromCalendar,
} from '../lib/stats';
import { storageGet } from '../lib/storage';

type User = {
  name?: string;
  picture?: string;
  leetcodeUsername?: string;
};

export function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<unknown>(null);
  const [solved, setSolved] = useState<unknown>(null);
  const [calendar, setCalendar] = useState<unknown>(null);
  const [skill, setSkill] = useState<unknown>(null);
  const [daily, setDaily] = useState<unknown>(null);
  const [blurb, setBlurb] = useState<string>('');
  const [meta, setMeta] = useState<{ stale?: boolean; staleReason?: string }>({});
  const [err, setErr] = useState<string | null>(null);
  const [privateProfile, setPrivateProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await storageGet(['user']);
      setUser((s.user as User) || null);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setErr(null);
      setPrivateProfile(false);
      try {
        const [p, sv, cal, sk, d] = await Promise.all([
          apiFetch<unknown>('/api/leetcode/me/profile'),
          apiFetch<unknown>('/api/leetcode/me/solved'),
          apiFetch<unknown>(`/api/leetcode/me/calendar?year=${new Date().getFullYear()}`),
          apiFetch<unknown>('/api/leetcode/me/skill'),
          apiFetch<unknown>('/api/leetcode/daily'),
        ]);
        setProfile(p.data);
        setSolved(sv.data);
        setCalendar(cal.data);
        setSkill(sk.data);
        setDaily(d.data);
        setMeta({
          stale: !!(p.meta.stale || sv.meta.stale || cal.meta.stale || sk.meta.stale || d.meta.stale),
          staleReason: p.meta.staleReason || sv.meta.staleReason,
        });
      } catch (e) {
        if (e instanceof ApiError && e.code === 'PRIVATE_PROFILE') {
          setPrivateProfile(true);
          return;
        }
        if (e instanceof ApiError && e.code === 'NO_LC_USER') {
          setErr('Add your LeetCode username in Settings to load stats.');
          return;
        }
        setErr(e instanceof Error ? e.message : 'Failed to load home data');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiFetch<{ blurb?: string }>('/api/ai/mentor/daily-blurb', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        if (data.blurb) setBlurb(data.blurb);
      } catch {
        /* optional */
      }
    })();
  }, []);

  const counts = extractSolvedCounts(solved ?? profile);
  const calMap = extractCalendarMap(calendar ?? profile);
  const streaks = streaksFromCalendar(calMap);
  const weak = extractWeakTags(skill, 10);
  const heatValues = Object.values(calMap);
  const maxHeat = heatValues.length ? Math.max(1, ...heatValues) : 1;
  const recentDays = Object.keys(calMap)
    .sort()
    .slice(-120);

  if (privateProfile) {
    return (
      <div className="card">
        <h2>Profile private</h2>
        <p>Your LeetCode profile must be public for us to read stats. Open LeetCode settings and make your profile public, then refresh.</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="card">
        <h2>Home</h2>
        <div className="banner error">{err}</div>
      </div>
    );
  }

  const totalSolved = counts.easy + counts.medium + counts.hard;

  return (
    <div>
      <StaleBanner meta={meta} />
      <div className="grid-2">
        <div className="card">
          <h2>Welcome</h2>
          <div className="row">
            {user?.picture ? (
              <img src={user.picture} alt="" width={48} height={48} style={{ borderRadius: '50%' }} />
            ) : null}
            <div>
              <div style={{ fontWeight: 700 }}>{user?.name || 'Learner'}</div>
              <div className="muted">@{user?.leetcodeUsername || 'set username in Settings'}</div>
            </div>
          </div>
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Global rank and badges appear in your full LeetCode profile; we surface practice-focused stats here.
          </p>
        </div>
        <div className="card">
          <h2>Solved</h2>
          {totalSolved === 0 ? (
            <p className="muted">No solved counts yet — start with today&apos;s daily or explore Problems.</p>
          ) : (
            <div className="rings">
              <div className="ring easy">
                <div>
                  E<br />
                  {counts.easy}
                </div>
              </div>
              <div className="ring medium">
                <div>
                  M<br />
                  {counts.medium}
                </div>
              </div>
              <div className="ring hard">
                <div>
                  H<br />
                  {counts.hard}
                </div>
              </div>
            </div>
          )}
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Current streak: <strong>{streaks.current}</strong> · Longest: <strong>{streaks.longest}</strong>
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Submission heatmap</h2>
        <div className="heatmap" aria-label="last 120 days activity">
          {recentDays.map((d) => {
            const c = calMap[d] || 0;
            const level = c <= 0 ? 0 : Math.min(4, Math.ceil((c / maxHeat) * 4));
            const bg =
              level === 0
                ? undefined
                : level === 1
                  ? '#1f6feb55'
                  : level === 2
                    ? '#1f6feb88'
                    : level === 3
                      ? '#1f6febbb'
                      : '#1f6feb';
            return <div key={d} className="heat-cell" title={`${d}: ${c}`} style={{ background: bg }} />;
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Daily problem</h2>
          <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', maxHeight: 200, overflow: 'auto' }}>
            {JSON.stringify(daily, null, 2).slice(0, 2000)}
          </pre>
          {blurb ? <p style={{ marginTop: '0.75rem' }}>{blurb}</p> : <p className="muted">AI blurb loads after stats sync.</p>}
        </div>
        <div className="card">
          <h2>Weak topics</h2>
          {weak.length === 0 ? (
            <p className="muted">Skill stats will appear once your profile syncs.</p>
          ) : (
            <div>
              {weak.map((t) => (
                <span key={t} className="tag">
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
