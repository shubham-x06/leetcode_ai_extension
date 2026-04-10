/**
 * Parses Alfa calendar payloads into a map of YYYY-MM-DD -> submission count.
 */
export function parseSubmissionCalendarMap(root: unknown): Record<string, number> {
  const map: Record<string, number> = {};

  const ingestObject = (o: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(o)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number') {
        map[k] = v;
      }
      if (/^\d{10,}$/.test(k) && typeof v === 'number') {
        const d = new Date(Number(k) * 1000);
        const key = d.toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + v;
      }
    }
  };

  const visit = (node: unknown, depth = 0): void => {
    if (depth > 24 || node == null) return;
    if (typeof node === 'string') {
      try {
        const parsed = JSON.parse(node) as unknown;
        visit(parsed, depth + 1);
      } catch {
        /* ignore */
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    if (typeof o.submissionCalendar === 'string') {
      visit(o.submissionCalendar, depth + 1);
    }
    if (typeof o.submissionCalendar === 'object' && o.submissionCalendar) {
      visit(o.submissionCalendar, depth + 1);
    }
    ingestObject(o);
    for (const v of Object.values(o)) visit(v, depth + 1);
  };

  visit(root);
  return map;
}

export function streaksFromCalendarMap(map: Record<string, number>): {
  current: number;
  longest: number;
  totalActiveDays: number;
} {
  const days = Object.entries(map)
    .filter(([, c]) => c > 0)
    .map(([d]) => d)
    .sort();
  const totalActiveDays = days.length;
  if (days.length === 0) return { current: 0, longest: 0, totalActiveDays: 0 };

  const toTs = (s: string) => new Date(`${s}T00:00:00Z`).getTime();
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const delta = (toTs(days[i]) - toTs(days[i - 1])) / 86400000;
    if (delta === 1) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else {
      cur = 1;
    }
  }

  let current = 0;
  const today = new Date();
  for (let i = 0; i < 500; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    if ((map[key] || 0) > 0) current += 1;
    else break;
  }

  return { current, longest: Math.max(longest, current), totalActiveDays };
}
