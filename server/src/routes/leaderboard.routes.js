/**
 * Public Leaderboard Route
 * No authentication required — visible to anyone
 */

const express = require('express');
const router = express.Router();
const talentService = require('../services/talent.service');

/**
 * GET /api/leaderboard
 * Public leaderboard of top-scoring developers
 * Query: ?badge=GREEN&limit=20&skills=react,docker
 */
router.get('/', async (req, res, next) => {
  try {
    const { badge, skills, limit = 20 } = req.query;

    const filters = {
      badge: badge || 'GREEN',
      limit: Math.min(parseInt(limit, 10) || 20, 50),
      page: 1,
      hasProject: true,
    };

    if (skills) {
      filters.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const result = await talentService.getTalentFeed(filters);

    // Sort by score descending for leaderboard
    const sorted = (result.developers || [])
      .filter((d) => d.score?.totalScore)
      .sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0));

    res.json({
      success: true,
      developers: sorted,
      total: sorted.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
