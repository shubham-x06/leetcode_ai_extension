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
