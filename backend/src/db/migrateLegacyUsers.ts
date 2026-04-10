import mongoose from 'mongoose';
import type { BookmarkDifficulty } from '../models/User';
import { normalizeBookmarkDifficulty } from '../models/User';

function mapDifficulty(v: unknown): 'Easy' | 'Medium' | 'Hard' | 'Mixed' {
  const s = String(v || '').toUpperCase();
  if (s === 'EASY') return 'Easy';
  if (s === 'MEDIUM') return 'Medium';
  if (s === 'HARD') return 'Hard';
  return 'Mixed';
}

function mapBookmarks(raw: unknown): {
  titleSlug: string;
  title: string;
  difficulty: BookmarkDifficulty;
  addedAt: Date;
}[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      const o = b as Record<string, unknown>;
      if (typeof o.titleSlug !== 'string' || typeof o.title !== 'string') return null;
      return {
        titleSlug: o.titleSlug,
        title: o.title,
        difficulty: normalizeBookmarkDifficulty(String(o.difficulty || 'Easy')),
        addedAt: o.addedAt instanceof Date ? o.addedAt : new Date(),
      };
    })
    .filter(Boolean) as {
    titleSlug: string;
    title: string;
    difficulty: BookmarkDifficulty;
    addedAt: Date;
  }[];
}

/**
 * Best-effort migration from pre-v2 user documents (flat fields + `picture` / `bookmarks`).
 */
export async function migrateLegacyUsers(): Promise<void> {
  const col = mongoose.connection.collection('users');
  const cursor = col.find({
    $or: [{ preferences: { $exists: false } }, { avatarUrl: { $exists: false }, picture: { $exists: true } }],
  });

  for await (const doc of cursor) {
    const u = doc as Record<string, unknown>;
    if (u.preferences && u.avatarUrl) continue;

    const prefs = u.preferences as Record<string, unknown> | undefined;
    const preferences = prefs || {
      targetDifficulty: mapDifficulty(u.targetDifficulty),
      dailyGoalCount: typeof u.dailyGoal === 'number' ? u.dailyGoal : 1,
      preferredLanguage: typeof u.preferredLanguage === 'string' ? u.preferredLanguage : 'Python',
      theme: u.theme === 'dark' || u.theme === 'light' ? u.theme : 'light',
    };

    const bookmarkedProblems =
      Array.isArray(u.bookmarkedProblems) && u.bookmarkedProblems.length
        ? mapBookmarks(u.bookmarkedProblems)
        : mapBookmarks(u.bookmarks);

    await col.updateOne(
      { _id: u._id },
      {
        $set: {
          avatarUrl: typeof u.avatarUrl === 'string' ? u.avatarUrl : (u.picture as string) || undefined,
          preferences,
          bookmarkedProblems,
          cachedWeakTopics: Array.isArray(u.cachedWeakTopics) ? u.cachedWeakTopics : [],
          hintHistory: Array.isArray(u.hintHistory) ? u.hintHistory : [],
          leetcodeUsername: u.leetcodeUsername === undefined ? null : u.leetcodeUsername,
        },
        $unset: {
          picture: '',
          bookmarks: '',
          targetDifficulty: '',
          dailyGoal: '',
          preferredLanguage: '',
          theme: '',
        },
      }
    );
  }
}
