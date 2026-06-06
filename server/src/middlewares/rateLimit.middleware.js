const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints
 * 10 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for company endpoints
 * 150 requests per 15 minutes per IP
 */
const companyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for interview request endpoints
 * 20 requests per 15 minutes per IP
 */
const interviewRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many interview request attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for notification endpoints
 * 500 requests per 15 minutes per IP (polling endpoint — needs headroom)
 */
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many notification requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for submission endpoints
 * Max 5 active submission attempts per user per 10 minutes.
 * Prevents queue flooding from a single user.
 */
const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many submissions. Please wait before submitting again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter for unauthenticated / anonymous requests
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  companyLimiter,
  interviewRequestLimiter,
  notificationLimiter,
  submissionLimiter,
  generalLimiter,
};

