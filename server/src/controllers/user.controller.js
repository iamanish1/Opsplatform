const userService = require('../services/user.service');

/**
 * GET /api/user/me
 * Get current user profile
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await userService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/user
 * Update user profile
 */
async function updateUser(req, res, next) {
  try {
    const userId = req.user.id;
    const updated = await userService.updateProfile(userId, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/onboarding
 * Get onboarding status
 */
async function getOnboarding(req, res, next) {
  try {
    const userId = req.user.id;
    const status = await userService.getOnboardingStatus(userId);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/user/onboarding
 * Update onboarding step (admin only)
 * Admin can update any user's onboarding step
 */
async function updateOnboarding(req, res, next) {
  try {
    // Admin can specify userId in body to update other users
    // If not provided, update the authenticated user
    const userId = req.body.userId || req.user.id;
    const step = req.body.onboardingStep;

    // Admin can go backwards (allowBackwards = true)
    const isAdmin = req.user.role === 'ADMIN';
    const updated = await userService.advanceOnboarding(userId, step, isAdmin);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/user/link-github
 * Link GitHub account
 * Auth: Optional (for OAuth callback, userId can be in body)
 */
async function linkGitHub(req, res, next) {
  try {
    // Get userId from authenticated user or request body
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID is required. Provide authentication token or userId in request body',
        },
      });
    }

    const githubData = {
      githubId: req.body.githubId,
      githubUsername: req.body.githubUsername,
      githubProfile: req.body.githubProfile,
      githubInstallId: req.body.githubInstallId,
    };

    const updated = await userService.linkGitHub(userId, githubData);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe,
  updateUser,
  getOnboarding,
  updateOnboarding,
  linkGitHub,
};
