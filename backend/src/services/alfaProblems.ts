/**
 * Normalizes Alfa `/problems` payloads into a list + total count.
 */
export function extractProblemsArray(root: unknown): unknown[] {
  if (Array.isArray(root)) return root;
  if (root && typeof root === 'object') {
    const o = root as Record<string, unknown>;
    const candidates = [
      o.problemsetQuestionList,
      o.problems,
      o.questions,
      o.data,
      o.result,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
      if (c && typeof c === 'object' && Array.isArray((c as { questions?: unknown[] }).questions)) {
        return (c as { questions: unknown[] }).questions;
      }
    }
  }
  return [];
}

export function extractTotalCount(root: unknown, fallback: number): number {
  if (root && typeof root === 'object') {
    const o = root as Record<string, unknown>;
    for (const k of ['totalProblems', 'totalNum', 'total', 'numQuestions', 'totalQuestions']) {
      const v = o[k];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
  }
  return fallback;
}

export function readSolvedProblemCount(root: unknown): number {
  if (root && typeof root === 'object') {
    const o = root as Record<string, unknown>;
    for (const k of ['numSolved', 'solvedProblems', 'solved', 'solvedNum', 'total']) {
      const v = o[k];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
  }
  return 0;
}

export type SlimProblem = { title: string; titleSlug: string; difficulty: string };

export function toSlimProblems(raw: unknown[], max: number): SlimProblem[] {
  const out: SlimProblem[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title : '';
    const titleSlug = typeof o.titleSlug === 'string' ? o.titleSlug : '';
    if (!title || !titleSlug || seen.has(titleSlug)) continue;
    seen.add(titleSlug);
    let difficulty = 'Medium';
    const d = o.difficulty;
    if (typeof d === 'string') {
      const u = d.toUpperCase();
      if (u === 'EASY') difficulty = 'Easy';
      else if (u === 'HARD') difficulty = 'Hard';
      else if (u === 'MEDIUM') difficulty = 'Medium';
      else difficulty = d;
    }
    out.push({ title, titleSlug, difficulty });
    if (out.length >= max) break;
  }
  return out;
}
