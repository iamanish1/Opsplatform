const express = require('express');
const router = express.Router();

const submissionController = require('../controllers/submission.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { submissionIdValidation } = require('../dto/submission.dto');

/**
 * GET /api/submissions/:submissionId
 * Get submission details
 * Auth: Required
 */
router.get(
  '/:submissionId',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.getSubmission
);

module.exports = router;

