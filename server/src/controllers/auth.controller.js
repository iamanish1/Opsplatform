const authService = require('../services/auth.service');
const githubOAuth = require('../utils/github-oauth');
const config = require('../config');
const refreshTokenRepo = require('../repositories/refreshToken.repo');

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

    // Handle OAuth callback — now returns both accessToken and refreshToken
    const result = await authService.handleOAuthCallback(code, state);

    const token = encodeURIComponent(result.token);
    const refreshToken = encodeURIComponent(result.refreshToken);
    const userData = encodeURIComponent(JSON.stringify(result.user));

    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}&user=${userData}`
    );
  } catch (error) {
    const frontendUrl = config.frontendUrl;
    const errorMsg = encodeURIComponent(
      error.message || 'Authentication failed. Please try again.'
    );
    res.redirect(`${frontendUrl}/auth/callback?error=${errorMsg}`);
  }
}

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access + refresh token pair
 */
async function refreshTokens(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' },
      });
    }

    const result = await authService.rotateRefreshToken(refreshToken);

    res.json({
      success: true,
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    if (error.code === 'INVALID_REFRESH_TOKEN') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Please log in again.' },
      });
    }
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
 * Revoke the provided refresh token and clear session
 * Auth: Required
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;

    // Revoke the specific refresh token if provided
    if (refreshToken) {
      await refreshTokenRepo.revoke(refreshToken);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  initiateGitHubOAuth,
  handleGitHubCallback,
  refreshTokens,
  getAuthStatus,
  logout,
};

