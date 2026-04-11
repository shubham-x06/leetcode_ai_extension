/**
 * Normalizes Alfa skill-stats payloads into weak topic names (lowest scores first).
 */
export function extractWeakTopics(skillPayload: unknown, limit = 5): string[] {
  const scores: { topic: string; score: number }[] = [];

  const visit = (node: unknown, depth = 0): void => {
    if (depth > 12 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;

    const tag =
      (typeof o.tagName === 'string' && o.tagName) ||
      (typeof o.name === 'string' && o.name) ||
      (typeof o.slug === 'string' && o.slug) ||
      (typeof o.topicName === 'string' && o.topicName);
    const rawScore =
      typeof o.score === 'number'
        ? o.score
        : typeof o.problemsSolved === 'number'
          ? o.problemsSolved
          : typeof o.ranking === 'number'
            ? -o.ranking
            : undefined;

    if (tag && typeof rawScore === 'number') {
      scores.push({ topic: tag, score: rawScore });
    }

    for (const v of Object.values(o)) {
      visit(v, depth + 1);
    }
  };

  visit(skillPayload);

  if (scores.length === 0) return [];

  const min = Math.min(...scores.map((s) => s.score));
  const max = Math.max(...scores.map((s) => s.score));
  const norm = scores.map((s) => ({
    topic: s.topic,
    n: max === min ? 0 : (s.score - min) / (max - min),
  }));

  norm.sort((a, b) => a.n - b.n);
  const weak = [...new Set(norm.map((x) => x.topic))];
  return weak.slice(0, limit);
}

/**
 * Picks weakest areas by lowest problemsSolved (per API design §4).
 */
export function extractWeakestTopicsByProblemsSolved(skillPayload: unknown, limit = 3): string[] {
  const rows: { topic: string; solved: number }[] = [];
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 14 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const tag =
      (typeof o.tagName === 'string' && o.tagName) ||
      (typeof o.name === 'string' && o.name) ||
      (typeof o.slug === 'string' && o.slug) ||
      (typeof o.topicName === 'string' && o.topicName);
    const solved = typeof o.problemsSolved === 'number' ? o.problemsSolved : undefined;
    if (tag && typeof solved === 'number') {
      rows.push({ topic: tag, solved });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(skillPayload);
  if (rows.length === 0) return extractWeakTopics(skillPayload, limit);
  rows.sort((a, b) => a.solved - b.solved);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.topic)) continue;
    seen.add(r.topic);
    out.push(r.topic);
    if (out.length >= limit) break;
  }
  return out;
}

export function extractTotalSolvedCount(solvedPayload: unknown): number {
  let best = 0;
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 18 || node == null) return;
    if (typeof node === 'object' && !Array.isArray(node)) {
      const o = node as Record<string, unknown>;
      for (const [k, v] of Object.entries(o)) {
        const key = k.toLowerCase();
        if (typeof v === 'number' && (key.includes('solved') || key.includes('ac'))) {
          if (key.includes('easy') || key.includes('medium') || key.includes('hard')) {
            best += v;
          } else if (key.includes('total') || key === 'solvedproblem' || key.includes('count')) {
            best = Math.max(best, v);
          }
        }
        visit(v, depth + 1);
      }
      return;
    }
    if (Array.isArray(node)) node.forEach((x) => visit(x, depth + 1));
  };
  visit(solvedPayload);
  if (best > 0) return best;
  const s = JSON.stringify(solvedPayload);
  const m = s.match(/"solvedProblem"\s*:\s*(\d+)/i);
  return m ? Number(m[1]) : 0;
}

/** Prefer explicit Alfa `solvedProblem` when present. */
export function readSolvedProblemCount(solvedPayload: unknown): number {
  if (solvedPayload && typeof solvedPayload === 'object') {
    const o = solvedPayload as Record<string, unknown>;
    if (typeof o.solvedProblem === 'number') return o.solvedProblem;
  }
  return extractTotalSolvedCount(solvedPayload);
}
