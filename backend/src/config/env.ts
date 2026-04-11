import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3001),
  groqApiKey: process.env.GROQ_API_KEY || '',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leetcode_ai_companion',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};

export function assertProductionConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    const required = ['JWT_SECRET', 'GROQ_API_KEY', 'MONGODB_URI', 'GOOGLE_CLIENT_ID'];
    for (const key of required) {
      if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
    }
  }
}
