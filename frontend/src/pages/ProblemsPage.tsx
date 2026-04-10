import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { SessionUser } from '../store/sessionStore';

type Problem = {
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  acRate?: string | number;
  topicTags?: { name?: string; slug?: string }[];
};

function extractProblems(root: unknown): Problem[] {
  const out: Problem[] = [];
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 22 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    if (typeof o.titleSlug === 'string' && typeof o.title === 'string') {
      out.push({
        title: o.title,
        titleSlug: o.titleSlug,
        difficulty: typeof o.difficulty === 'string' ? o.difficulty : undefined,
        acRate: typeof o.acRate === 'string' || typeof o.acRate === 'number' ? o.acRate : undefined,
        topicTags: Array.isArray(o.topicTags) ? (o.topicTags as Problem['topicTags']) : undefined,
      });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(root);
  const seen = new Set<string>();
  return out.filter((p) => {
    if (!p.titleSlug) return false;
    if (seen.has(p.titleSlug)) return false;
    seen.add(p.titleSlug);
    return true;
  });
}

function normalizeBookmarkDifficulty(d: string): 'Easy' | 'Medium' | 'Hard' {
  const u = d.toUpperCase();
  if (u === 'EASY') return 'Easy';
  if (u === 'MEDIUM') return 'Medium';
  return 'Hard';
}

export function ProblemsPage() {
  const queryClient = useQueryClient();
  const [difficulty, setDifficulty] = useState('');
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'explore' | 'bookmarks'>('explore');
  const [solution, setSolution] = useState<string | null>(null);

  const problemsQ = useQuery({
    queryKey: ['problems', 'list', { difficulty, tags, search }],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (difficulty) q.set('difficulty', difficulty);
      if (tags.trim()) q.set('tags', tags.trim().replace(/\s+/g, '+').replace(/,/g, '+'));
      if (search.trim()) q.set('search', search.trim());
      q.set('limit', '40');
      const res = await api.get<{ problems?: unknown[]; total?: number }>(`/api/problems/list?${q.toString()}`);
      return res.data;
    },
  });

  const meQ = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await api.get<SessionUser>('/api/user/me');
      return res.data;
    },
  });

  const problems = useMemo(() => {
    const raw = problemsQ.data?.problems;
    if (Array.isArray(raw)) return extractProblems(raw);
    return extractProblems(problemsQ.data);
  }, [problemsQ.data]);

  const bookmarks = meQ.data?.bookmarkedProblems ?? [];
  const bookmarkSet = useMemo(() => new Set(bookmarks.map((b) => b.titleSlug)), [bookmarks]);

  const loadOfficial = useCallback(async (titleSlug: string) => {
    setSolution(null);
    try {
      const res = await api.get<{ solution?: { content?: string } }>(
        `/api/problems/official-solution?titleSlug=${encodeURIComponent(titleSlug)}`
      );
      const c = res.data.solution?.content;
      setSolution(c ?? JSON.stringify(res.data, null, 2).slice(0, 12000));
    } catch (e) {
      setSolution(e instanceof Error ? e.message : 'Failed');
    }
  }, []);

  const toggleBookmark = useCallback(
    async (p: Problem) => {
      if (!p.titleSlug || !p.title) return;
      const diff = normalizeBookmarkDifficulty(p.difficulty || 'Medium');
      try {
        if (bookmarkSet.has(p.titleSlug)) {
          await api.delete(`/api/user/bookmarks/${encodeURIComponent(p.titleSlug)}`);
        } else {
          await api.post('/api/user/bookmarks', {
            titleSlug: p.titleSlug,
            title: p.title,
            difficulty: diff,
          });
        }
        await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      } catch {
        /* ignore */
      }
    },
    [bookmarkSet, queryClient]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm ${tab === 'explore' ? 'border-[var(--accent)] bg-[var(--accent)] text-[#0f0f12]' : 'border-[var(--border)]'}`}
            onClick={() => setTab('explore')}
          >
            Explore
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm ${tab === 'bookmarks' ? 'border-[var(--accent)] bg-[var(--accent)] text-[#0f0f12]' : 'border-[var(--border)]'}`}
            onClick={() => setTab('bookmarks')}
          >
            Bookmarks ({bookmarks.length})
          </button>
        </div>
        {tab === 'explore' ? (
          <>
            <h2 className="text-base font-semibold">Problem explorer</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Any difficulty</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <input
                className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
                placeholder="Tags (array+hash-table)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <input
                className="min-w-[160px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
                placeholder="Search title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[#0f0f12]"
                onClick={() => void problemsQ.refetch()}
              >
                Apply
              </button>
            </div>
          </>
        ) : (
          <h2 className="text-base font-semibold">Saved problems</h2>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        {problemsQ.isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-white/5" />
        ) : problemsQ.isError ? (
          <p className="text-sm text-red-200">{(problemsQ.error as Error).message}</p>
        ) : (
          <div className="max-h-[32rem] space-y-2 overflow-auto text-sm">
            {(tab === 'explore' ? problems : bookmarks).map((item, idx) => {
              const p =
                tab === 'explore'
                  ? (item as Problem)
                  : ({
                      title: (item as { title: string }).title,
                      titleSlug: (item as { titleSlug: string }).titleSlug,
                      difficulty: (item as { difficulty: string }).difficulty,
                    } as Problem);
              const slug = p.titleSlug || '';
              const diff = (p.difficulty || '').toLowerCase();
              const badge =
                diff === 'easy'
                  ? 'text-[var(--easy)]'
                  : diff === 'medium'
                    ? 'text-[var(--medium)]'
                    : diff === 'hard'
                      ? 'text-[var(--hard)]'
                      : '';
              return (
                <div
                  key={slug || String(idx)}
                  className="flex flex-col justify-between gap-2 border-b border-[var(--border)] py-2 last:border-0 sm:flex-row sm:items-start"
                >
                  <div>
                    <strong>{p.title}</strong>
                    <div className="text-xs text-[var(--muted)]">{slug}</div>
                    {tab === 'explore' && (p as Problem).topicTags ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(p as Problem).topicTags?.slice(0, 6).map((t) => (
                          <span key={t.slug || t.name} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px]">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={`text-xs font-medium ${badge}`}>{p.difficulty || '—'}</span>
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                      onClick={() => window.open(`https://leetcode.com/problems/${slug}`, '_blank')}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                      onClick={() => void loadOfficial(slug)}
                    >
                      Official
                    </button>
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                      onClick={() => void toggleBookmark(p as Problem)}
                    >
                      {bookmarkSet.has(slug) ? 'Unsave' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {solution ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Official solution</h2>
            <button type="button" className="text-sm text-[var(--accent)]" onClick={() => setSolution(null)}>
              Close
            </button>
          </div>
          <pre className="max-h-80 overflow-auto text-xs text-[var(--muted)]">{solution}</pre>
        </div>
      ) : null}
    </div>
  );
}
