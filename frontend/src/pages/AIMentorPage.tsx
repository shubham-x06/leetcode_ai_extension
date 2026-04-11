import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { analyzeCode, getDailyGoal, getRecommendation } from '../api/ai';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function AIMentorPage() {
  const [dailyGoals, setDailyGoals] = useState<string>('');
  const [nextProblem, setNextProblem] = useState<string>('');
  const [postAnalysis, setPostAnalysis] = useState('');
  const [postCode, setPostCode] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postLang, setPostLang] = useState('Python3');

  const goalsM = useMutation({
    mutationFn: getDailyGoal,
    onSuccess: (data) => setDailyGoals(JSON.stringify(data, null, 2)),
  });

  const nextM = useMutation({
    mutationFn: getRecommendation,
    onSuccess: (data) => setNextProblem(JSON.stringify(data, null, 2)),
  });

  const postM = useMutation({
    mutationFn: () =>
      analyzeCode({
        problemDescription: postTitle || 'Problem context not provided.',
        userCode: postCode,
        language: postLang,
      }),
    onSuccess: (data) => setPostAnalysis(JSON.stringify(data, null, 2)),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <h2 className="text-base font-semibold">Daily goals</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">AI motivation + problems from your weak topics (cached until UTC midnight).</p>
        <Button className="mt-3 px-3 py-2" disabled={goalsM.isPending} onClick={() => goalsM.mutate()}>
          {goalsM.isPending ? 'Working…' : 'Load daily goal'}
        </Button>
        {dailyGoals ? (
          <pre className="mt-3 whitespace-pre-wrap text-xs text-[var(--muted)]">{dailyGoals}</pre>
        ) : null}
      </Card>
      <Card>
        <h2 className="text-base font-semibold">Next problem</h2>
        <Button className="mt-3 px-3 py-2" disabled={nextM.isPending} onClick={() => nextM.mutate()}>
          {nextM.isPending ? 'Working…' : 'Recommend next'}
        </Button>
        {nextProblem ? (
          <pre className="mt-3 whitespace-pre-wrap text-xs text-[var(--muted)]">{nextProblem}</pre>
        ) : null}
      </Card>
      <Card className="md:col-span-2">
        <h2 className="text-base font-semibold">Post-solve analysis</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Structured JSON: complexity, tips, and topic reinforcement.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            placeholder="Short problem summary"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
          />
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            value={postLang}
            onChange={(e) => setPostLang(e.target.value)}
          >
            <option>Python3</option>
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
        <Button className="mt-2 px-3 py-2" disabled={postM.isPending} onClick={() => postM.mutate()}>
          {postM.isPending ? 'Analyzing…' : 'Analyze'}
        </Button>
        {postAnalysis ? (
          <pre className="mt-3 whitespace-pre-wrap text-sm text-[var(--text)]">{postAnalysis}</pre>
        ) : null}
      </Card>
    </div>
  );
}
