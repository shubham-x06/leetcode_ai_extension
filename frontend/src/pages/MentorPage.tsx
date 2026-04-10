import { useState } from 'react';
import { apiFetch } from '../lib/api';

export function MentorPage() {
  const [dailyGoals, setDailyGoals] = useState<string>('');
  const [nextProblem, setNextProblem] = useState<string>('');
  const [postCode, setPostCode] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postLang, setPostLang] = useState('Python');
  const [studyTopic, setStudyTopic] = useState('dynamic-programming');
  const [postAnalysis, setPostAnalysis] = useState('');
  const [studyPlanOut, setStudyPlanOut] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<void>) {
    setErr(null);
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Daily goals</h2>
        <p className="muted">AI picks 1–3 problems aligned with your weak topics.</p>
        <button
          type="button"
          className="primary"
          disabled={!!busy}
          onClick={() =>
            run('goals', async () => {
              const { data } = await apiFetch<unknown>('/api/ai/mentor/daily-goals', {
                method: 'POST',
                body: JSON.stringify({}),
              });
              setDailyGoals(JSON.stringify(data, null, 2));
            })
          }
        >
          {busy === 'goals' ? 'Working…' : 'Generate daily goals'}
        </button>
        {dailyGoals ? (
          <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{dailyGoals}</pre>
        ) : null}
      </div>
      <div className="card">
        <h2>Next problem</h2>
        <button
          type="button"
          className="primary"
          disabled={!!busy}
          onClick={() =>
            run('next', async () => {
              const { data } = await apiFetch<unknown>('/api/ai/mentor/next-problem', {
                method: 'POST',
                body: JSON.stringify({}),
              });
              setNextProblem(JSON.stringify(data, null, 2));
            })
          }
        >
          {busy === 'next' ? 'Working…' : 'Recommend next'}
        </button>
        {nextProblem ? (
          <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{nextProblem}</pre>
        ) : null}
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Post-solve analysis</h2>
        <input placeholder="Problem title" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
        <select value={postLang} onChange={(e) => setPostLang(e.target.value)} style={{ marginLeft: 8 }}>
          <option>Python</option>
          <option>Java</option>
          <option>C++</option>
          <option>JavaScript</option>
          <option>TypeScript</option>
        </select>
        <textarea
          style={{ width: '100%', minHeight: 140, marginTop: 8 }}
          placeholder="Paste your accepted solution"
          value={postCode}
          onChange={(e) => setPostCode(e.target.value)}
        />
        <button
          type="button"
          className="primary"
          style={{ marginTop: 8 }}
          disabled={!!busy}
          onClick={() =>
            run('post', async () => {
              const { data } = await apiFetch<{ analysis?: string }>('/api/ai/mentor/post-solve', {
                method: 'POST',
                body: JSON.stringify({
                  problemTitle: postTitle,
                  code: postCode,
                  language: postLang,
                }),
              });
              setPostAnalysis(data.analysis || JSON.stringify(data));
            })
          }
        >
          {busy === 'post' ? 'Analyzing…' : 'Analyze'}
        </button>
        {postAnalysis ? (
          <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{postAnalysis}</pre>
        ) : null}
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>7-day study plan</h2>
        <div className="row">
          <input value={studyTopic} onChange={(e) => setStudyTopic(e.target.value)} placeholder="Topic slug, e.g. binary-search" />
          <button
            type="button"
            className="primary"
            disabled={!!busy}
            onClick={() =>
              run('plan', async () => {
                const { data } = await apiFetch<unknown>('/api/ai/mentor/study-plan', {
                  method: 'POST',
                  body: JSON.stringify({ topic: studyTopic }),
                });
                setStudyPlanOut(JSON.stringify(data, null, 2));
              })
            }
          >
            {busy === 'plan' ? 'Building…' : 'Build plan'}
          </button>
        </div>
        <p className="muted">Uses real problems from the Alfa API for the topic you enter.</p>
        {studyPlanOut ? (
          <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{studyPlanOut}</pre>
        ) : null}
      </div>
      {err ? (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="banner error">{err}</div>
        </div>
      ) : null}
    </div>
  );
}
