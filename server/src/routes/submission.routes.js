const express = require('express');
const router = express.Router();

const submissionController = require('../controllers/submission.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * GET /api/submissions/:submissionId
 * Get submission details
 * Auth: Required
 */
router.get('/:submissionId', authenticate, submissionController.getSubmission);

module.exports = router;

