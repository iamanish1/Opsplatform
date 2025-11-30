const prisma = require('../prisma/client');

/**
 * Find user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by GitHub ID
 * @param {string} githubId - GitHub ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findByGithubId(githubId) {
  return prisma.user.findUnique({
    where: { githubId },
  });
}

/**
 * Create new user
 * @param {Object} data - User data
 * @returns {Promise<Object>} Created user
 */
async function create(data) {
  return prisma.user.create({
    data,
  });
}

/**
 * Update user fields
 * @param {string} id - User ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function update(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

/**
 * Set GitHub installation ID
 * @param {string} id - User ID
 * @param {string} installId - GitHub installation ID
 * @returns {Promise<Object>} Updated user
 */
async function setGithubInstall(id, installId) {
  return prisma.user.update({
    where: { id },
    data: {
      githubInstallId: installId,
    },
  });
}

/**
 * Get onboarding progress (lesson counts)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Progress counts
 */
async function getOnboardingProgress(userId) {
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    select: {
      completed: true,
    },
  });

  const completed = lessonProgress.filter((p) => p.completed).length;
  const total = await prisma.lesson.count();

  return {
    completed,
    total,
  };
}

/**
 * Advance onboarding step
 * @param {string} id - User ID
 * @param {number} step - New onboarding step
 * @returns {Promise<Object>} Updated user
 */
async function advanceOnboardingStep(id, step) {
  return prisma.user.update({
    where: { id },
    data: {
      onboardingStep: step,
    },
  });
}

/**
 * Link GitHub account to user
 * @param {string} id - User ID
 * @param {Object} githubData - GitHub data (githubId, githubUsername, githubProfile, githubInstallId)
 * @returns {Promise<Object>} Updated user
 */
async function linkGitHub(id, githubData) {
  return prisma.user.update({
    where: { id },
    data: {
      githubId: githubData.githubId,
      githubUsername: githubData.githubUsername,
      githubProfile: githubData.githubProfile,
      githubInstallId: githubData.githubInstallId || undefined,
      onboardingStep: 1, // GitHub connected
    },
  });
}

/**
 * Clear GitHub installation ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} Updated user
 */
async function clearGithubInstall(id) {
  return prisma.user.update({
    where: { id },
    data: {
      githubInstallId: null,
    },
  });
}

/**
 * Find user by GitHub installation ID
 * @param {string} installationId - GitHub installation ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findByGithubInstallId(installationId) {
  return prisma.user.findFirst({
    where: { githubInstallId: installationId },
  });
}

/**
 * Create user with hashed password (for company email/password auth)
 * @param {Object} userData - User data including password (will be hashed by service)
 * @returns {Promise<Object>} Created user
 */
async function createWithPassword(userData) {
  return prisma.user.create({
    data: userData,
  });
}

/**
 * Find user by email including password field (for password verification)
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object with password or null
 */
async function findByEmailWithPassword(email) {
  return prisma.user.findUnique({
    where: { email },
    // Password field is included by default in Prisma queries
  });
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<Object>} Updated user
 */
async function updatePassword(userId, hashedPassword) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
}

module.exports = {
  findById,
  findByEmail,
  findByGithubId,
  create,
  update,
  setGithubInstall,
  getOnboardingProgress,
  advanceOnboardingStep,
  linkGitHub,
  clearGithubInstall,
  findByGithubInstallId,
  createWithPassword,
  findByEmailWithPassword,
  updatePassword,
};
