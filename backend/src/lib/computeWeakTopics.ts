import { LeetCodeSkills, SkillTag } from '../services/leetcodeGraphql';

export interface WeakTopic {
  name: string;
  slug: string;
  problemsSolved: number;
  /** Solve rate as a percentage (0-100), computed relative to total solved across all topics */
  solveRate: number;
}

/**
 * Derives the 3 weakest topics from skill stats.
 * "Weakest" = lowest ratio of problemsSolved vs. the max solved in that tier.
 * Returns rich objects including a deterministic solveRate (no randomness).
 */
export function computeWeakTopics(skills: LeetCodeSkills): WeakTopic[] {
  const all: SkillTag[] = [
    ...skills.advanced,
    ...skills.intermediate,
    ...skills.fundamental,
  ];

  if (all.length === 0) return [];

  // Total problems solved across all topics (for a denominator)
  const totalSolved = all.reduce((sum, t) => sum + t.problemsSolved, 0);
  // Max in any single topic (used to scale the bar)
  const maxSolved = Math.max(...all.map(t => t.problemsSolved));

  // Sort ascending by problemsSolved — fewest = weakest
  const sorted = [...all].sort((a, b) => a.problemsSolved - b.problemsSolved);

  return sorted.slice(0, 3).map(tag => {
    // solveRate: percentage of total solved that comes from this topic
    // Scaled up so the weakest topics show a meaningful (but still small) bar
    const rawRate = totalSolved > 0 ? (tag.problemsSolved / Math.max(maxSolved, 1)) * 100 : 0;
    const solveRate = Math.round(Math.min(rawRate, 100));
    return {
      name: tag.tagName,
      slug: tag.tagSlug,
      problemsSolved: tag.problemsSolved,
      solveRate,
    };
  });
}

/** Legacy helper: returns just names for backward compat (e.g. cachedWeakTopics in DB) */
export function computeWeakTopicNames(skills: LeetCodeSkills): string[] {
  return computeWeakTopics(skills).map(t => t.name);
}
