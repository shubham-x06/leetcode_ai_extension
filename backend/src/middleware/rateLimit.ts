import rateLimit from 'express-rate-limit';

/**
 * 10 AI requests per minute per authenticated user (falls back to IP).
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip || 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: 60,
    });
  },
});
