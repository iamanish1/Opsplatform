const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rate limiting for OAuth endpoints
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // Limit each IP to 20 OAuth attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many OAuth requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 * Redirects to GitHub authorization page
 */
router.get('/github', oauthLimiter, authController.initiateGitHubOAuth);

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 * Returns JWT token and user data
 */
router.get('/github/callback', oauthLimiter, authController.handleGitHubCallback);

/**
 * GET /api/auth/status
 * Get authentication status
 * Auth: Required
 */
router.get('/status', authenticate, authController.getAuthStatus);

/**
 * POST /api/auth/logout
 * Logout (optional)
 * Auth: Required
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;

