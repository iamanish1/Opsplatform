const authService = require('../services/auth.service');
const githubOAuth = require('../utils/github-oauth');

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
async function initiateGitHubOAuth(req, res, next) {
  try {
    // Generate OAuth URL with state
    const { oauthUrl } = authService.initiateOAuth();

    // Redirect to GitHub
    res.redirect(oauthUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
async function handleGitHubCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;

    // Check if user cancelled
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OAUTH_CANCELLED',
          message: 'GitHub OAuth authorization was cancelled',
        },
      });
    }

    // Handle OAuth callback
    const result = await authService.handleOAuthCallback(code, state);

    // In production, you might want to set a cookie or redirect to frontend
    // For now, return JSON response
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/status
 * Get authentication status
 * Auth: Required
 */
async function getAuthStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const status = await authService.getAuthStatus(userId);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Logout (optional - clears session)
 * Auth: Required
 */
async function logout(req, res, next) {
  try {
    // For JWT-based auth, logout is handled client-side by removing token
    // This endpoint can be used for logging or future session management
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  initiateGitHubOAuth,
  handleGitHubCallback,
  getAuthStatus,
  logout,
};

