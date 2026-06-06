const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const { auditAction } = require('../middlewares/audit.middleware');

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
 * POST /api/auth/refresh
 * Exchange refresh token for new access + refresh token pair
 * Auth: Not required (the refresh token IS the credential)
 */
router.post('/refresh', authLimiter, authController.refreshTokens);

/**
 * GET /api/auth/status
 * Get authentication status
 * Auth: Required
 */
router.get('/status', authenticate, authController.getAuthStatus);

/**
 * POST /api/auth/logout
 * Logout — revokes refresh token
 * Auth: Required
 */
router.post('/logout', authenticate, auditAction('auth.logout', 'User', (req) => req.user?.id), authController.logout);

module.exports = router;

