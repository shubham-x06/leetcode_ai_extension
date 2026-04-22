import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { aiRateLimiter } from './middleware/rateLimit';

import { publicAuthRouter, protectedAuthRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { problemsRouter } from './routes/problems';
import { aiRouter } from './routes/ai';
import { interviewRouter } from './routes/interview';
import { codeRunnerRouter } from './routes/codeRunner';

dotenv.config();

const app = express();

/* ====================== CORS FIX (FINAL) ====================== */
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://leetcode-ai-extension-gold.vercel.app',
        'https://leetcode-ai-extension-f2rbjl3kp.vercel.app',
      ];

      // allow requests without origin (Postman / curl)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('chrome-extension://')
      ) {
        return callback(null, true);
      }

      console.error('❌ CORS BLOCKED:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
/* ============================================================= */

app.use(express.json());

const port = process.env.PORT || 3001;

/* ====================== HEALTH ====================== */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
/* ==================================================== */

/* ====================== ROUTES ====================== */
app.use('/api/auth', publicAuthRouter);
app.use('/api/auth', requireAuth, protectedAuthRouter);

app.use('/api/user', requireAuth, userRouter);
app.use('/api/problems', requireAuth, problemsRouter);
app.use('/api/code', requireAuth, codeRunnerRouter);

app.use('/api/ai', requireAuth, aiRateLimiter, aiRouter);

const interviewRateLimiter = rateLimit({
  windowMs: 60 * 60_000,   // 1 hour
  max: 30,                  // 30 per hour — very generous
  keyGenerator: (req) => `interview-${(req as any).userId || req.ip}`,
  handler: (_req, res) => res.status(429).json({
    error: 'Too many interviews started. Please wait before starting another session.',
    retryAfter: 3600,
  }),
  skip: () => process.env.NODE_ENV === 'development', // no limit in dev
});

app.use(
  '/api/interview',
  requireAuth,
  interviewRateLimiter,
  interviewRouter
);
/* ==================================================== */

/* ====================== ERROR HANDLER ====================== */
app.use(errorHandler);
/* ========================================================= */

/* ====================== DB CONNECT ====================== */
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI missing');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
/* ===================================================== */

/* ====================== START SERVER ====================== */
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
/* ========================================================= */