import rateLimit from 'express-rate-limit';

export const createAssignmentLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,   // 15 minutes
  max:              10,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many assignment creation requests. Try again in 15 minutes.' },
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

export const regenerateLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              5,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many regeneration requests. Try again in 15 minutes.' },
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

const isDev = process.env.NODE_ENV !== 'production';

export const generalLimiter = rateLimit({
  windowMs:         1 * 60 * 1000,   // 1 minute window (more forgiving reset)
  max:              isDev ? 200 : 60, // generous in dev (React Strict Mode doubles requests)
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests. Please slow down.' },
  },
  standardHeaders: true,
  legacyHeaders:   false,
});
