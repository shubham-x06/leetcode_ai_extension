export function computeStreaks(calendarJson: string): { streak: number; longestStreak: number; totalActiveDays: number } {
  if (!calendarJson) return { streak: 0, longestStreak: 0, totalActiveDays: 0 };
  let parsed: Record<string, number> = {};
  try {
    parsed = typeof calendarJson === 'string' ? JSON.parse(calendarJson) : calendarJson;
  } catch {
    return { streak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const map: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === 'number' && v > 0) {
      if (/^\d{10,}$/.test(k)) {
        const d = new Date(Number(k) * 1000);
        map[d.toISOString().slice(0, 10)] = 1;
      }
    }
  }

  const days = Object.keys(map).sort();
  const totalActiveDays = days.length;
  if (totalActiveDays === 0) return { streak: 0, longestStreak: 0, totalActiveDays: 0 };

  const toTs = (s: string) => new Date(`${s}T00:00:00Z`).getTime();
  let longestStreak = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const delta = (toTs(days[i]) - toTs(days[i - 1])) / 86400000;
    if (delta === 1) {
      cur += 1;
      longestStreak = Math.max(longestStreak, cur);
    } else {
      cur = 1;
    }
  }

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 500; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    if (map[key]) {
      streak += 1;
    } else {
      break;
    }
  }

  // Handle case where streak missed today but user was active previously
  // Wait, the prompt says "from today backwards" but "should count days up to last active day" inside the other prompt?
  // User Prompt: "count consecutive days for current streak (from today backwards)... Handle empty input returning all zeros."
  // It also says: "Today missing from calendar -> streak should count days up to last active day".
  if (streak === 0) {
    const lastActive = days[days.length - 1];
    let curTrailing = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const delta = (toTs(days[i+1]) - toTs(days[i])) / 86400000;
      if (delta === 1) {
        curTrailing++;
      } else {
        break;
      }
    }
    streak = curTrailing;
  }

  return { streak, longestStreak: Math.max(longestStreak, streak), totalActiveDays };
}
