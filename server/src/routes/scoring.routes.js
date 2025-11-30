/**
 * Scoring Routes
 * Internal API routes for score computation
 */

const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoring.controller');

// POST /internal/score/compute
// Internal API endpoint for computing scores
// Note: In production, add API key authentication middleware here
router.post('/compute', scoringController.computeScore);

module.exports = router;

