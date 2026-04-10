import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';

export function MentorPage() {
  const [dailyGoals, setDailyGoals] = useState<string>('');
  const [nextProblem, setNextProblem] = useState<string>('');
  const [postAnalysis, setPostAnalysis] = useState('');
  const [studyPlanOut, setStudyPlanOut] = useState('');
  const [postCode, setPostCode] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postLang, setPostLang] = useState('Python');
  const [studyTopic, setStudyTopic] = useState('dynamic-programming');

  const goalsM = useMutation({
    mutationFn: async () => {
      const res = await api.post<unknown>('/api/ai/mentor/daily-goals', {});
      return res.data;
    },
    onSuccess: (data) => setDailyGoals(JSON.stringify(data, null, 2)),
  });

  const nextM = useMutation({
    mutationFn: async () => {
      const res = await api.post<unknown>('/api/ai/mentor/next-problem', {});
      return res.data;
    },
    onSuccess: (data) => setNextProblem(JSON.stringify(data, null, 2)),
  });

  const postM = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ analysis?: string }>('/api/ai/mentor/post-solve', {
        problemTitle: postTitle,
        code: postCode,
        language: postLang,
      });
      return res.data;
    },
    onSuccess: (data) => setPostAnalysis(data.analysis || JSON.stringify(data)),
  });

  const planM = useMutation({
    mutationFn: async () => {
      const res = await api.post<unknown>('/api/ai/mentor/study-plan', { topic: studyTopic });
      return res.data;
    },
    onSuccess: (data) => setStudyPlanOut(JSON.stringify(data, null, 2)),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Daily goals</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">AI picks 1–3 problems from weak topics + Alfa list.</p>
        <button
          type="button"
          className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[#0f0f12] disabled:opacity-50"
          disabled={goalsM.isPending}
          onClick={() => goalsM.mutate()}
        >
          {goalsM.isPending ? 'Working…' : 'Generate daily goals'}
        </button>
        {dailyGoals ? (
          <pre className="mt-3 whitespace-pre-wrap text-xs text-[var(--muted)]">{dailyGoals}</pre>
        ) : null}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="text-base font-semibold">Next problem</h2>
        <button
          type="button"
          className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[#0f0f12] disabled:opacity-50"
          disabled={nextM.isPending}
          onClick={() => nextM.mutate()}
        >
          {nextM.isPending ? 'Working…' : 'Recommend next'}
        </button>
        {nextProblem ? (
          <pre className="mt-3 whitespace-pre-wrap text-xs text-[var(--muted)]">{nextProblem}</pre>
        ) : null}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 md:col-span-2">
        <h2 className="text-base font-semibold">Post-solve analysis</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            placeholder="Problem title"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
          />
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            value={postLang}
            onChange={(e) => setPostLang(e.target.value)}
          >
            <option>Python</option>
            <option>Java</option>
            <option>C++</option>
            <option>JavaScript</option>
            <option>TypeScript</option>
          </select>
        </div>
        <textarea
          className="mt-2 w-full min-h-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 text-sm"
          placeholder="Paste your accepted solution"
          value={postCode}
          onChange={(e) => setPostCode(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[#0f0f12] disabled:opacity-50"
          disabled={postM.isPending}
          onClick={() => postM.mutate()}
        >
          {postM.isPending ? 'Analyzing…' : 'Analyze'}
        </button>
        {postAnalysis ? (
          <pre className="mt-3 whitespace-pre-wrap text-sm text-[var(--text)]">{postAnalysis}</pre>
        ) : null}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 md:col-span-2">
        <h2 className="text-base font-semibold">7-day study plan</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[240px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            value={studyTopic}
            onChange={(e) => setStudyTopic(e.target.value)}
            placeholder="Topic slug, e.g. binary-search"
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[#0f0f12] disabled:opacity-50"
            disabled={planM.isPending}
            onClick={() => planM.mutate()}
          >
            {planM.isPending ? 'Building…' : 'Build plan'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Uses real problems from the Alfa-backed proxy for the topic you enter.</p>
        {studyPlanOut ? (
          <pre className="mt-3 whitespace-pre-wrap text-xs text-[var(--muted)]">{studyPlanOut}</pre>
        ) : null}
      </div>
    </div>
  );
}
