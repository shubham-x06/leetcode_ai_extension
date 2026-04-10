import rateLimit from 'express-rate-limit';

/**
 * 10 AI requests per minute per authenticated user (falls back to IP).
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.userId) return `uid:${req.userId.toString()}`;
    return `ip:${req.ip || 'unknown'}`;
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many AI requests, try again in a minute',
      code: 'AI_RATE_LIMIT_WINDOW',
    });
  },
});
