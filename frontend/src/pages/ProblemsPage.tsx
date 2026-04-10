import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, apiFetch } from '../lib/api';

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

export function ProblemsPage() {
  const [difficulty, setDifficulty] = useState('');
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<unknown>(null);
  const [bookmarks, setBookmarks] = useState<{ titleSlug: string; title: string; difficulty: string }[]>([]);
  const [meta, setMeta] = useState<{ stale?: boolean; staleReason?: string }>({});
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'explore' | 'bookmarks'>('explore');
  const [solution, setSolution] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      const { data: b } = await apiFetch<{ bookmarks?: typeof bookmarks }>('/api/bookmarks');
      setBookmarks(b.bookmarks || []);
    } catch {
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  async function loadProblems() {
    setErr(null);
    try {
      const q = new URLSearchParams();
      if (difficulty) q.set('difficulty', difficulty);
      if (tags.trim()) q.set('tags', tags.trim().replace(/\s+/g, '+').replace(/,/g, '+'));
      if (search.trim()) q.set('search', search.trim());
      q.set('limit', '40');
      const { data: d, meta: m } = await apiFetch<unknown>(`/api/leetcode/problems?${q.toString()}`, {
        auth: false,
      });
      setData(d);
      setMeta({ stale: m.stale, staleReason: m.staleReason });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load problems');
    }
  }

  useEffect(() => {
    loadProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const problems = useMemo(() => extractProblems(data), [data]);
  const bookmarkSet = useMemo(() => new Set(bookmarks.map((b) => b.titleSlug)), [bookmarks]);

  async function toggleBookmark(p: Problem) {
    if (!p.titleSlug || !p.title) return;
    const diff = (p.difficulty || 'UNKNOWN').toUpperCase();
    try {
      if (bookmarkSet.has(p.titleSlug)) {
        await apiFetch(`/api/bookmarks/${encodeURIComponent(p.titleSlug)}`, { method: 'DELETE' });
      } else {
        await apiFetch('/api/bookmarks', {
          method: 'POST',
          body: JSON.stringify({ titleSlug: p.titleSlug, title: p.title, difficulty: diff }),
        });
      }
      await loadBookmarks();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setErr('Sign in to use bookmarks.');
      } else {
        setErr(e instanceof Error ? e.message : 'Bookmark failed');
      }
    }
  }

  async function loadOfficial(titleSlug: string) {
    setSolution(null);
    try {
      const { data: d } = await apiFetch<unknown>(
        `/api/leetcode/official-solution?titleSlug=${encodeURIComponent(titleSlug)}`,
        { auth: false }
      );
      setSolution(JSON.stringify(d, null, 2).slice(0, 12000));
    } catch (e) {
      setSolution(e instanceof Error ? e.message : 'Failed to load official solution');
    }
  }

  return (
    <div>
      {meta.stale ? (
        <div className="banner warn">Data may be outdated ({meta.staleReason || 'stale cache'}).</div>
      ) : null}
      <div className="card">
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          <button type="button" className={tab === 'explore' ? 'primary' : ''} onClick={() => setTab('explore')}>
            Explore
          </button>
          <button type="button" className={tab === 'bookmarks' ? 'primary' : ''} onClick={() => setTab('bookmarks')}>
            Bookmarks ({bookmarks.length})
          </button>
        </div>
        {tab === 'explore' ? (
          <>
            <h2>Problem explorer</h2>
            <div className="row" style={{ marginBottom: '0.75rem' }}>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">Any difficulty</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <input placeholder="Tags (e.g. array+hash-table)" value={tags} onChange={(e) => setTags(e.target.value)} />
              <input placeholder="Search title" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="button" className="primary" onClick={loadProblems}>
                Apply
              </button>
            </div>
          </>
        ) : (
          <h2>Saved problems</h2>
        )}
        {err ? <div className="banner error">{err}</div> : null}
      </div>
      <div className="card">
        <div className="problem-list">
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
              diff === 'easy' ? 'badge-easy' : diff === 'medium' ? 'badge-medium' : diff === 'hard' ? 'badge-hard' : '';
            return (
              <div key={slug || String(idx)} className="problem-row">
                <div>
                  <strong>{p.title}</strong>
                  <div className="muted">{slug}</div>
                  {tab === 'explore' && (p as Problem).topicTags ? (
                    <div>
                      {(p as Problem).topicTags?.slice(0, 6).map((t) => (
                        <span key={t.slug || t.name} className="tag">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`tag ${badge}`}>{p.difficulty || '—'}</span>
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
                    <button type="button" onClick={() => window.open(`https://leetcode.com/problems/${slug}`, '_blank')}>
                      Open
                    </button>
                    <button type="button" onClick={() => loadOfficial(slug)}>
                      Official
                    </button>
                    <button type="button" onClick={() => toggleBookmark(p as Problem)}>
                      {bookmarkSet.has(slug) ? 'Unsave' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {solution ? (
        <div className="card">
          <h2>Official solution payload</h2>
          <button type="button" onClick={() => setSolution(null)} style={{ marginBottom: '0.5rem' }}>
            Close
          </button>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', maxHeight: 360, overflow: 'auto' }}>{solution}</pre>
        </div>
      ) : null}
    </div>
  );
}
