import express, { Router } from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth';
import { validateBody } from './middleware/validate';
import { errorHandler } from './middleware/errorHandler';
import { aiRateLimiter } from './middleware/rateLimitAi';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { bookmarkRouter } from './routes/bookmarkRoutes';
import { leetcodeRouter } from './routes/leetcodeRoutes';
import { aiRouter, postHintHandler, postSolutionHandler } from './routes/aiRoutes';
import { hintBodySchema, solutionBodySchema } from './validation/schemas';

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

  app.use('/api/auth', authRouter);

  const protectedApi = Router();
  protectedApi.use(requireAuth);
  protectedApi.use('/user', userRouter);
  protectedApi.use('/bookmarks', bookmarkRouter);
  protectedApi.use('/leetcode', leetcodeRouter);
  protectedApi.use('/ai', aiRateLimiter, aiRouter);
  protectedApi.post('/get-hint', validateBody(hintBodySchema), postHintHandler);
  protectedApi.post('/get-solution', validateBody(solutionBodySchema), postSolutionHandler);

  app.use('/api', protectedApi);

  app.use(errorHandler);

  return app;
}
