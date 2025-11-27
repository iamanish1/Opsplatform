const userRepo = require('../repositories/user.repo');
const lessonRepo = require('../repositories/lesson.repo');
const { ONBOARDING_STEPS } = require('../utils/constants');

/**
 * Get full user profile with computed fields
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile with computed fields
 */
async function getProfile(userId) {
  const user = await userRepo.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Get onboarding progress
  const progress = await userRepo.getOnboardingProgress(userId);
  const lessonsTotal = await lessonRepo.countAll();

  // Compute flags
  const githubConnected = Boolean(user.githubId || user.githubUsername);
  const lessonsCompleted = progress.completed;
  const canStartProject = githubConnected && lessonsCompleted >= lessonsTotal;

  // Return user with computed fields
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    onboardingStep: user.onboardingStep,
    githubUsername: user.githubUsername,
    githubInstallId: user.githubInstallId, // Note: Consider if this should be exposed
    trustScore: user.trustScore,
    badge: user.badge,
    canStartProject,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Update user profile (only allowed fields)
 * @param {string} userId - User ID
 * @param {Object} payload - Update data
 * @returns {Promise<Object>} Updated user
 */
async function updateProfile(userId, payload) {
  // Verify user exists
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Extract only allowed fields
  const allowedFields = ['name', 'avatar'];
  const updateData = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  }

  // If no valid fields to update
  if (Object.keys(updateData).length === 0) {
    const error = new Error('No valid fields to update');
    error.statusCode = 400;
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Update user
  const updated = await userRepo.update(userId, updateData);

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    avatar: updated.avatar,
    role: updated.role,
    onboardingStep: updated.onboardingStep,
    githubUsername: updated.githubUsername,
    trustScore: updated.trustScore,
    badge: updated.badge,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Get onboarding status with detailed flags
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Onboarding status
 */
async function getOnboardingStatus(userId) {
  const user = await userRepo.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Get lesson progress
  const progress = await userRepo.getOnboardingProgress(userId);
  const lessonsTotal = await lessonRepo.countAll();

  // Compute flags
  const githubConnected = Boolean(user.githubId || user.githubUsername);
  const lessonsCompleted = progress.completed;
  const canStartProject = githubConnected && lessonsCompleted >= lessonsTotal;

  return {
    onboardingStep: user.onboardingStep,
    lessonsCompleted,
    lessonsTotal,
    githubConnected,
    canStartProject,
  };
}

/**
 * Advance onboarding step (with validation)
 * @param {string} userId - User ID
 * @param {number} step - New onboarding step
 * @param {boolean} allowBackwards - Allow going backwards (for admin)
 * @returns {Promise<Object>} Updated user
 */
async function advanceOnboarding(userId, step, allowBackwards = false) {
  // Validate step range
  if (step < 0 || step > 4) {
    const error = new Error('Invalid onboarding step');
    error.statusCode = 400;
    error.code = 'INVALID_INPUT';
    throw error;
  }

  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Don't allow going backwards unless explicitly allowed (for admin)
  if (!allowBackwards && step < user.onboardingStep) {
    const error = new Error('Cannot go backwards in onboarding steps');
    error.statusCode = 400;
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Update step
  const updated = await userRepo.advanceOnboardingStep(userId, step);

  return {
    id: updated.id,
    onboardingStep: updated.onboardingStep,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Link GitHub account to user
 * @param {string} userId - User ID
 * @param {Object} githubData - GitHub data
 * @returns {Promise<Object>} Updated user
 */
async function linkGitHub(userId, githubData) {
  // Check if GitHub ID is already linked to another user
  if (githubData.githubId) {
    const existingUser = await userRepo.findByGithubId(githubData.githubId);
    if (existingUser && existingUser.id !== userId) {
      const error = new Error('GitHub account already linked to another user');
      error.statusCode = 409;
      error.code = 'CONFLICT';
      throw error;
    }
  }

  // Verify user exists
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Link GitHub account
  try {
    const updated = await userRepo.linkGitHub(userId, githubData);

    return {
      id: updated.id,
      githubId: updated.githubId,
      githubUsername: updated.githubUsername,
      githubProfile: updated.githubProfile,
      onboardingStep: updated.onboardingStep,
      updatedAt: updated.updatedAt,
    };
  } catch (error) {
    // Handle Prisma unique constraint error
    if (error.code === 'P2002' && error.meta?.target?.includes('githubId')) {
      const conflictError = new Error('GitHub account already linked to another user');
      conflictError.statusCode = 409;
      conflictError.code = 'CONFLICT';
      throw conflictError;
    }
    throw error;
  }
}

/**
 * Compute if user can start a project
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user can start project
 */
async function computeCanStartProject(userId) {
  const user = await userRepo.findById(userId);

  if (!user) {
    return false;
  }

  const githubConnected = Boolean(user.githubId || user.githubUsername);
  const lessonsCompleted = await lessonRepo.countCompletedForUser(userId);
  const lessonsTotal = await lessonRepo.countAll();

  return githubConnected && lessonsCompleted >= lessonsTotal;
}

module.exports = {
  getProfile,
  updateProfile,
  getOnboardingStatus,
  advanceOnboarding,
  linkGitHub,
  computeCanStartProject,
};
