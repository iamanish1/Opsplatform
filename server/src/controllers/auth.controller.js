const authService = require('../services/auth.service');
const githubOAuth = require('../utils/github-oauth');
const config = require('../config');

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
async function initiateGitHubOAuth(req, res, next) {
  try {
    // Generate OAuth URL with state (now async due to Redis)
    const { oauthUrl } = await authService.initiateOAuth();

    // Redirect to GitHub
    res.redirect(oauthUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 * Redirects to frontend with token and user data
 */
async function handleGitHubCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = config.frontendUrl;

    // Check if user cancelled
    if (error) {
      const errorMsg = encodeURIComponent('GitHub OAuth authorization was cancelled');
      return res.redirect(`${frontendUrl}/auth/callback?error=${errorMsg}`);
    }

    // Handle OAuth callback
    const result = await authService.handleOAuthCallback(code, state);

    // Redirect to frontend with token and user data in URL parameters
    // Note: In production, consider using httpOnly cookies for better security
    const token = encodeURIComponent(result.token);
    const userData = encodeURIComponent(JSON.stringify(result.user));
    
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userData}`);
  } catch (error) {
    // Redirect to frontend with error message
    const frontendUrl = config.frontendUrl;
    const errorMsg = encodeURIComponent(
      error.message || 'Authentication failed. Please try again.'
    );
    res.redirect(`${frontendUrl}/auth/callback?error=${errorMsg}`);
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

