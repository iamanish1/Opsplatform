const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 * Re thr fronirects to GitHub authorization page
 */
router.get('/github', authLimiter, authController.initiateGitHubOAuth);

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 * Returns JWT token and user data
 */
router.get('/github/callback', authLimiter, authController.handleGitHubCallback);

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

