/**
 * Talent Feed Controller
 * Handles talent feed requests
 */

const talentService = require('../services/talent.service');

/**
 * Get talent feed
 * GET /api/company/talent-feed
 * Auth: Required (company role)
 */
async function getTalentFeed(req, res, next) {
  try {
    // Extract query parameters
    const {
      badge,
      minScore,
      maxScore,
      skills,
      country,
      hasProject,
      githubUsername,
      page,
      limit,
    } = req.query;

    // Build filters object
    const filters = {};

    if (badge) {
      filters.badge = badge.toUpperCase(); // GREEN, YELLOW, RED
    }

    if (minScore !== undefined) {
      filters.minScore = parseInt(minScore, 10);
    }

    if (maxScore !== undefined) {
      filters.maxScore = parseInt(maxScore, 10);
    }

    if (skills) {
      // Skills can be comma-separated string or array
      filters.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim());
    }

    if (country) {
      filters.country = country;
    }

    if (hasProject !== undefined) {
      filters.hasProject = hasProject === 'true' || hasProject === true;
    }

    if (githubUsername) {
      filters.githubUsername = githubUsername;
    }

    if (page) {
      filters.page = parseInt(page, 10) || 1;
    }

    if (limit) {
      filters.limit = parseInt(limit, 10) || 20;
    }

    // Validate badge value
    if (filters.badge && !['GREEN', 'YELLOW', 'RED'].includes(filters.badge)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Badge must be one of: GREEN, YELLOW, RED',
        },
      });
    }

    // Get talent feed
    const result = await talentService.getTalentFeed(filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTalentFeed,
};

