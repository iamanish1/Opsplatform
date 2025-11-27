const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate, authenticateOptional } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  updateUserValidation,
  updateOnboardingValidation,
  linkGitHubValidation,
} = require('../dto/user.update.dto');

// Rate limiting for update endpoints
const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many update requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/user/me
 * Get current user profile
 * Auth: Required
 */
router.get('/me', authenticate, userController.getMe);

/**
 * PATCH /api/user
 * Update user profile
 * Auth: Required
 * Rate Limit: 10 requests per 15 minutes
 */
router.patch(
  '/',
  authenticate,
  updateLimiter,
  updateUserValidation,
  validate,
  userController.updateUser
);

/**
 * GET /api/user/onboarding
 * Get onboarding status
 * Auth: Required
 */
router.get('/onboarding', authenticate, userController.getOnboarding);

/**
 * PATCH /api/user/onboarding
 * Update onboarding step
 * Auth: Required (Admin only)
 * Rate Limit: 10 requests per 15 minutes
 */
router.patch(
  '/onboarding',
  authenticate,
  requireRole('ADMIN'),
  updateLimiter,
  updateOnboardingValidation,
  validate,
  userController.updateOnboarding
);

/**
 * POST /api/user/link-github
 * Link GitHub account
 * Auth: Optional (for OAuth callback)
 * Rate Limit: 10 requests per 15 minutes
 */
router.post(
  '/link-github',
  authenticateOptional,
  updateLimiter,
  linkGitHubValidation,
  validate,
  userController.linkGitHub
);

module.exports = router;
