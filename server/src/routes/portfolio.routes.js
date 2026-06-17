/**
 * Portfolio Routes
 * Public and authenticated portfolio endpoints
 */

const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Authenticated routes (must be registered before /:slug to avoid shadowing)
router.get('/', authenticate, portfolioController.getUserPortfolios);
router.get('/submission/:submissionId', authenticate, portfolioController.getPortfolioBySubmission);

// Public route: Get portfolio by slug (no auth required)
router.get('/:slug', portfolioController.getPortfolioBySlug);

module.exports = router;

