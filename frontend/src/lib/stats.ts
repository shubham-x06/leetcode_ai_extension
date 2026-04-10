export interface SolvedCounts {
  easy: number;
  medium: number;
  hard: number;
}

export function extractSolvedCounts(root: unknown): SolvedCounts {
  const out: SolvedCounts = { easy: 0, medium: 0, hard: 0 };
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 18 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      const key = k.toLowerCase();
      if (typeof v === 'number') {
        if (key.includes('easy') && (key.includes('solved') || key.includes('submit') || key.includes('beat'))) {
          out.easy = Math.max(out.easy, v);
        }
        if (key.includes('medium') && (key.includes('solved') || key.includes('submit'))) {
          out.medium = Math.max(out.medium, v);
        }
        if (key.includes('hard') && (key.includes('solved') || key.includes('submit'))) {
          out.hard = Math.max(out.hard, v);
        }
      }
      visit(v, depth + 1);
    }
  };
  visit(root);
  return out;
}

export function extractCalendarMap(root: unknown): Record<string, number> {
  const map: Record<string, number> = {};
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 22 || node == null) return;
    if (typeof node === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(node)) {
        /* key might be in parent */
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number') {
        map[k] = v;
      } else if (typeof v === 'object' && v && !Array.isArray(v)) {
        const inner = v as Record<string, unknown>;
        for (const [k2, v2] of Object.entries(inner)) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(k2) && typeof v2 === 'number') {
            map[k2] = v2;
          }
        }
      }
      visit(v, depth + 1);
    }
  };
  visit(root);
  return map;
}

export function streaksFromCalendar(map: Record<string, number>): { current: number; longest: number } {
  const days = Object.entries(map)
    .filter(([, c]) => c > 0)
    .map(([d]) => d)
    .sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  const toDate = (s: string) => new Date(`${s}T00:00:00Z`).getTime();
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = toDate(days[i - 1]);
    const next = toDate(days[i]);
    const delta = (next - prev) / 86400000;
    if (delta === 1) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else {
      cur = 1;
    }
  }

  const today = new Date();
  const utc = (d: Date) => d.toISOString().slice(0, 10);
  let current = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = utc(d);
    if ((map[key] || 0) > 0) current += 1;
    else break;
  }

  return { current, longest: Math.max(longest, current) };
}

export function extractRadarTopics(skillPayload: unknown): { topic: string; value: number }[] {
  const scores: { topic: string; value: number }[] = [];
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 16 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const tag =
      (typeof o.tagName === 'string' && o.tagName) ||
      (typeof o.name === 'string' && o.name) ||
      (typeof o.slug === 'string' && o.slug);
    const score =
      typeof o.score === 'number'
        ? o.score
        : typeof o.problemsSolved === 'number'
          ? o.problemsSolved
          : undefined;
    if (tag && typeof score === 'number') {
      scores.push({ topic: tag, value: score });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(skillPayload);
  const uniq = new Map<string, number>();
  for (const s of scores) {
    uniq.set(s.topic, Math.max(uniq.get(s.topic) || 0, s.value));
  }
  return [...uniq.entries()]
    .map(([topic, value]) => ({ topic, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function extractWeakTags(skillPayload: unknown, limit = 8): string[] {
  const radar = extractRadarTopics(skillPayload);
  if (radar.length === 0) return [];
  const min = Math.min(...radar.map((r) => r.value));
  const weak = radar.filter((r) => r.value === min).map((r) => r.topic);
  const rest = radar.map((r) => r.topic).filter((t) => !weak.includes(t));
  return [...weak, ...rest].slice(0, limit);
}

export function extractLanguageSplit(langPayload: unknown): { name: string; value: number }[] {
  const out: { name: string; value: number }[] = [];
  const visit = (node: unknown, depth = 0): void => {
    if (depth > 16 || node == null) return;
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const name =
      (typeof o.languageName === 'string' && o.languageName) ||
      (typeof o.langName === 'string' && o.langName) ||
      (typeof o.name === 'string' && o.name);
    const value =
      typeof o.problemsSolved === 'number'
        ? o.problemsSolved
        : typeof o.count === 'number'
          ? o.count
          : undefined;
    if (name && typeof value === 'number' && name.length < 40) {
      out.push({ name, value });
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(langPayload);
  const map = new Map<string, number>();
  for (const x of out) map.set(x.name, (map.get(x.name) || 0) + x.value);
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}
