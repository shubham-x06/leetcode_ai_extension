export interface LeetCodeSkills {
  advanced?: any[];
  intermediate?: any[];
  fundamental?: any[];
  [key: string]: any;
}

export function computeWeakTopics(skillsData: LeetCodeSkills): string[] {
  if (!skillsData) return [];
  const allSkills: any[] = [];
  if (Array.isArray(skillsData.advanced)) allSkills.push(...skillsData.advanced);
  if (Array.isArray(skillsData.intermediate)) allSkills.push(...skillsData.intermediate);
  if (Array.isArray(skillsData.fundamental)) allSkills.push(...skillsData.fundamental);
  // Also try to find a raw data structure if Alfa modified it
  if (allSkills.length === 0) {
    if (skillsData.data && typeof skillsData.data === 'object') {
       const o = skillsData.data as any;
       if (Array.isArray(o.advanced)) allSkills.push(...o.advanced);
       if (Array.isArray(o.intermediate)) allSkills.push(...o.intermediate);
       if (Array.isArray(o.fundamental)) allSkills.push(...o.fundamental);
    }
  }

  // Fallback if not an array but an object
  const validSkills = allSkills.filter(s => s && (s.tagName || s.name || s.topicName) && typeof s.problemsSolved === 'number');

  validSkills.sort((a, b) => (a.problemsSolved || 0) - (b.problemsSolved || 0));

  const weakTopics = validSkills.slice(0, 3).map(s => s.tagName || s.name || s.topicName || '');
  return weakTopics.filter(Boolean);
}

export function extractWeakestTopicsByProblemsSolved(skillPayload: unknown, limit = 3): string[] {
  return computeWeakTopics(skillPayload as LeetCodeSkills);
}

export function extractTotalSolvedCount(solvedPayload: unknown): number {
  if (!solvedPayload) return 0;
  const o = solvedPayload as any;
  if (typeof o.solvedProblem === 'number') return o.solvedProblem;
  if (o.data && typeof o.data.solvedProblem === 'number') return o.data.solvedProblem;
  // Deep search logic fallback (if we really need it)
  return 0;
}

export function readSolvedProblemCount(solvedPayload: unknown): number {
  return extractTotalSolvedCount(solvedPayload);
}
