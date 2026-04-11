import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type BookmarkDifficulty = 'Easy' | 'Medium' | 'Hard';
export type TargetDifficultyPref = 'Easy' | 'Medium' | 'Hard' | 'Mixed';
export type ThemePref = 'light' | 'dark';

export interface BookmarkedProblem {
  titleSlug: string;
  title: string;
  difficulty: BookmarkDifficulty;
  addedAt: Date;
}

export interface HintHistoryItem {
  problemSlug: string;
  hint: string;
  askedAt: Date;
}

export interface UserPreferences {
  targetDifficulty: TargetDifficultyPref;
  dailyGoalCount: number;
  preferredLanguage: string;
  theme: ThemePref;
}

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
  leetcodeUsername: string | null;
  cachedWeakTopics: string[];
  bookmarkedProblems: BookmarkedProblem[];
  preferences: UserPreferences;
  hintHistory: HintHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkedProblemSchema = new Schema<BookmarkedProblem>(
  {
    titleSlug: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HintHistorySchema = new Schema<HintHistoryItem>(
  {
    problemSlug: { type: String, required: true },
    hint: { type: String, required: true },
    askedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PreferencesSchema = new Schema<UserPreferences>(
  {
    targetDifficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Mixed',
    },
    dailyGoalCount: { type: Number, min: 1, max: 5, default: 1 },
    preferredLanguage: { type: String, default: 'Python' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    leetcodeUsername: { type: String, default: null, trim: true, sparse: true, index: true },
    cachedWeakTopics: { type: [String], default: [] },
    bookmarkedProblems: { type: [BookmarkedProblemSchema], default: [] },
    preferences: {
      type: PreferencesSchema,
      default: () => ({}),
    },
    hintHistory: { type: [HintHistorySchema], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ leetcodeUsername: 1 }, { sparse: true });

export default mongoose.model<IUser>('User', UserSchema);
export const User = mongoose.model<IUser>('User', UserSchema);

export type UserDocument = IUser & { _id: Types.ObjectId };

/** Map API/Alfa difficulty string to stored bookmark difficulty */
export function normalizeBookmarkDifficulty(raw: string): BookmarkDifficulty {
  const u = raw.toUpperCase();
  if (u === 'EASY' || u === 'Easy') return 'Easy';
  if (u === 'MEDIUM' || u === 'Medium') return 'Medium';
  return 'Hard';
}
