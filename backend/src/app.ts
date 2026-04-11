import express, { Router } from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { aiRateLimiter } from './middleware/rateLimit';
import { publicAuthRouter, protectedAuthRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { problemsRouter } from './routes/problems';
import { aiRouter } from './routes/ai';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }
        if (origin.startsWith('chrome-extension://')) {
          cb(null, true);
          return;
        }
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', publicAuthRouter);

  const protectedApi = Router();
  protectedApi.use(requireAuth);
  protectedApi.use('/auth', protectedAuthRouter);
  protectedApi.use('/user', userRouter);
  protectedApi.use('/problems', problemsRouter);
  protectedApi.use('/ai', aiRateLimiter, aiRouter);

  app.use('/api', protectedApi);

  app.use(errorHandler);

  return app;
}
