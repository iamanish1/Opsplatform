/**
 * Talent Feed Routes
 * Developer discovery and filtering for companies
 */

const express = require('express');
const router = express.Router();
const talentController = require('../controllers/talent.controller');
const { authenticate, requireCompany } = require('../middlewares/auth.middleware');

/**
 * GET /api/company/talent-feed
 * Get filtered talent feed
 * Auth: Required (company role)
 * Query params: badge, minScore, maxScore, skills, country, hasProject, githubUsername, page, limit
 */
router.get('/', authenticate, requireCompany, talentController.getTalentFeed);

module.exports = router;

