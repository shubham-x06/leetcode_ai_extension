import { LeetCodeSkills, SkillTag } from '../services/leetcodeGraphql';

/**
 * Derives the 3 topic names with the lowest problemsSolved count from skill stats.
 * Flattens advanced + intermediate + fundamental into one array, sorts ascending,
 * returns the bottom 3 names. Topics with 0 solves are excluded if all have > 0.
 */
export function computeWeakTopics(skills: LeetCodeSkills): string[] {
  const all: SkillTag[] = [
    ...skills.advanced,
    ...skills.intermediate,
    ...skills.fundamental,
  ];

  if (all.length === 0) return [];

  const sorted = [...all].sort((a, b) => a.problemsSolved - b.problemsSolved);
  return sorted.slice(0, 3).map(s => s.tagName);
}
