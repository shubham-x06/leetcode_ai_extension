import type { Types } from 'mongoose';
import { User } from '../models/User';
import { alfaGet } from './alfaClient';
import { extractWeakTopics } from './weakTopics';

export async function getWeakTopicsForUser(userId: Types.ObjectId): Promise<string[]> {
  const user = await User.findById(userId).lean();
  const username = user?.leetcodeUsername?.trim();
  if (!username) return [];
  try {
    const { data } = await alfaGet(`/${encodeURIComponent(username)}/skill`);
    return extractWeakTopics(data, 8);
  } catch {
    return [];
  }
}
