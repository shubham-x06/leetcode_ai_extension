import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

export const env = {
  port: Number(process.env.PORT || 3001),
  groqApiKey: process.env.GROQ_API_KEY || '',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leetcode_ai_companion',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  alfaApiBaseUrl: (process.env.ALFA_API_BASE_URL || 'https://alfa-leetcode-api.onrender.com').replace(
    /\/$/,
    ''
  ),
};

export function assertProductionConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    required('JWT_SECRET');
    required('GROQ_API_KEY');
    required('MONGODB_URI');
    required('GOOGLE_CLIENT_ID');
  }
}
