import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { aiRateLimiter } from './middleware/rateLimit';
import { publicAuthRouter, protectedAuthRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { problemsRouter } from './routes/problems';
import { aiRouter } from './routes/ai';

dotenv.config();

const app = express();


app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL || '',
    /^chrome-extension:\/\//
  ].filter(Boolean) as (string | RegExp)[],
  credentials: true
}));

app.use(express.json());

const port = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', publicAuthRouter);
app.use('/api/auth', requireAuth, protectedAuthRouter);
app.use('/api/user', requireAuth, userRouter);
app.use('/api/problems', requireAuth, problemsRouter);
app.use('/api/ai', requireAuth, aiRateLimiter, aiRouter);

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.info('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.error('Cannot start server without database connection. Exiting.');
    process.exit(1);
  });

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}`);
});
