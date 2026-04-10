import type { Types } from 'mongoose';
import { AppError } from '../errors/AppError';
import { User } from '../models/User';
import { alfaGet } from './alfaClient';
import { chatText } from './groqAi';
import { getWeakTopicsForUser } from './userContext';

export async function buildDailyGoalsPayload(userId: Types.ObjectId): Promise<unknown> {
  const user = await User.findById(userId);
  if (!user?.leetcodeUsername) {
    throw new AppError(400, 'Set LeetCode username first', 'NO_LC_USER');
  }
  const weak = await getWeakTopicsForUser(userId);
  const tag = weak[0] || 'array';
  const { data: problems } = await alfaGet(`/problems?tags=${encodeURIComponent(tag)}&limit=15`);
  const system =
    'Pick 1-3 problem slugs for today based on JSON list and user weak topics. Respond JSON only: {"goals":[{"titleSlug":"","title":"","reason":""}]}';
  const userPrompt = `Weak topics: ${weak.join(', ')}. Problems: ${JSON.stringify(problems).slice(0, 6000)}`;
  const raw = await chatText(system, userPrompt, 400);
  try {
    return JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
  } catch {
    return { goals: [], raw };
  }
}
