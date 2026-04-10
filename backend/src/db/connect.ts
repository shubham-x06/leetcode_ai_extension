import mongoose from 'mongoose';
import { env } from '../config/env';

let connected = false;

export async function connectDb(): Promise<void> {
  if (connected) return;
  await mongoose.connect(env.mongodbUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  connected = true;
}
