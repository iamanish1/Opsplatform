const prisma = require('../prisma/client');

/**
 * Find notification preferences by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Preferences or null
 */
async function findByUserId(userId) {
  return prisma.userNotificationPreferences.findUnique({
    where: {
      userId,
    },
  });
}

/**
 * Create or update notification preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Preference data
 * @returns {Promise<Object>} Created or updated preferences
 */
async function createOrUpdate(userId, preferences) {
  const {
    emailEnabled,
    emailScoreReady,
    emailPortfolioReady,
    emailInterviewRequest,
    emailInterviewUpdate,
  } = preferences;

  return prisma.userNotificationPreferences.upsert({
    where: {
      userId,
    },
    update: {
      emailEnabled: emailEnabled !== undefined ? emailEnabled : undefined,
      emailScoreReady: emailScoreReady !== undefined ? emailScoreReady : undefined,
      emailPortfolioReady: emailPortfolioReady !== undefined ? emailPortfolioReady : undefined,
      emailInterviewRequest: emailInterviewRequest !== undefined ? emailInterviewRequest : undefined,
      emailInterviewUpdate: emailInterviewUpdate !== undefined ? emailInterviewUpdate : undefined,
    },
    create: {
      userId,
      emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
      emailScoreReady: emailScoreReady !== undefined ? emailScoreReady : true,
      emailPortfolioReady: emailPortfolioReady !== undefined ? emailPortfolioReady : true,
      emailInterviewRequest: emailInterviewRequest !== undefined ? emailInterviewRequest : true,
      emailInterviewUpdate: emailInterviewUpdate !== undefined ? emailInterviewUpdate : true,
    },
  });
}

/**
 * Check if email should be sent for notification type
 * @param {string} userId - User ID
 * @param {string} notificationType - Notification type (SCORE_READY, PORTFOLIO_READY, etc.)
 * @returns {Promise<boolean>} True if email should be sent
 */
async function shouldSendEmail(userId, notificationType) {
  const preferences = await findByUserId(userId);

  // If no preferences exist, default to true (email enabled)
  if (!preferences) {
    return true;
  }

  // Check global email enabled flag
  if (!preferences.emailEnabled) {
    return false;
  }

  // Check type-specific preferences
  switch (notificationType) {
    case 'SCORE_READY':
      return preferences.emailScoreReady;
    case 'PORTFOLIO_READY':
      return preferences.emailPortfolioReady;
    case 'INTERVIEW_REQUESTED':
      return preferences.emailInterviewRequest;
    case 'INTERVIEW_ACCEPTED':
    case 'INTERVIEW_REJECTED':
      return preferences.emailInterviewUpdate;
    default:
      return preferences.emailEnabled;
  }
}

module.exports = {
  findByUserId,
  createOrUpdate,
  shouldSendEmail,
};

