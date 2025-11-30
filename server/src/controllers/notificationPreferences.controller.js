/**
 * Notification Preferences Controller
 * Handles notification preferences API endpoints
 */

const notificationPreferencesRepo = require('../repositories/notificationPreferences.repo');

/**
 * Get user notification preferences
 * GET /api/notifications/preferences
 */
async function getPreferences(req, res, next) {
  try {
    const userId = req.user.id;

    let preferences = await notificationPreferencesRepo.findByUserId(userId);

    // If no preferences exist, return defaults
    if (!preferences) {
      preferences = {
        emailEnabled: true,
        emailScoreReady: true,
        emailPortfolioReady: true,
        emailInterviewRequest: true,
        emailInterviewUpdate: true,
      };
    }

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user notification preferences
 * PATCH /api/notifications/preferences
 */
async function updatePreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Allowed fields
    const allowedFields = [
      'emailEnabled',
      'emailScoreReady',
      'emailPortfolioReady',
      'emailInterviewRequest',
      'emailInterviewUpdate',
    ];

    // Filter to only allowed fields
    const filteredPreferences = {};
    Object.keys(preferences).forEach((key) => {
      if (allowedFields.includes(key) && typeof preferences[key] === 'boolean') {
        filteredPreferences[key] = preferences[key];
      }
    });

    const updated = await notificationPreferencesRepo.createOrUpdate(userId, filteredPreferences);

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
};

