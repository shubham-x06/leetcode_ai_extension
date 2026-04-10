import mongoose from 'mongoose';
import { env } from '../config/env';
import { migrateLegacyUsers } from './migrateLegacyUsers';

let connected = false;

export async function connectDb(): Promise<void> {
  if (connected) return;
  await mongoose.connect(env.mongodbUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  connected = true;
  try {
    await migrateLegacyUsers();
  } catch (e) {
    console.error('[migrateLegacyUsers]', e);
  }
}
