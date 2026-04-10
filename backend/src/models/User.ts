import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type TargetDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
export type ThemePreference = 'light' | 'dark';

export interface BookmarkItem {
  titleSlug: string;
  title: string;
  difficulty: string;
  addedAt: Date;
}

export interface IUser extends Document {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  leetcodeUsername?: string;
  preferredLanguage: string;
  targetDifficulty: TargetDifficulty;
  dailyGoal: number;
  theme: ThemePreference;
  bookmarks: BookmarkItem[];
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<BookmarkItem>(
  {
    titleSlug: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String },
    picture: { type: String },
    leetcodeUsername: { type: String, trim: true },
    preferredLanguage: { type: String, default: 'Python' },
    targetDifficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD', 'MIXED'],
      default: 'MIXED',
    },
    dailyGoal: { type: Number, min: 1, max: 5, default: 2 },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    bookmarks: { type: [BookmarkSchema], default: [] },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

export type UserDocument = IUser & { _id: Types.ObjectId };
