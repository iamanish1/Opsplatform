const express = require('express');
const router = express.Router();

const submissionController = require('../controllers/submission.controller');
const taskProgressController = require('../controllers/taskProgress.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { submissionIdValidation } = require('../dto/submission.dto');
const {
  taskIdValidation,
  updateTaskStatusValidation,
} = require('../dto/taskProgress.dto');
const { submissionLimiter } = require('../middlewares/rateLimit.middleware');
const { auditAction } = require('../middlewares/audit.middleware');

/**
 * GET /api/submissions
 * Get all submissions for the current user
 * Auth: Required
 */
router.get(
  '/',
  authenticate,
  submissionController.getSubmissions
);

/**
 * POST /api/submissions/:submissionId/submit
 * Submit project for review (all tasks must be complete)
 * Auth: Required | Rate limited: 5 per 10 min per user
 */
router.post(
  '/:submissionId/submit',
  authenticate,
  submissionLimiter,
  auditAction('submission.submit', 'Submission', (req) => req.params.submissionId),
  submissionIdValidation,
  validate,
  submissionController.submitForReview
);

/**
 * GET /api/submissions/:submissionId/tasks
 * Get all tasks with completion status for a submission
 * Auth: Required
 */
router.get(
  '/:submissionId/tasks',
  authenticate,
  submissionIdValidation,
  validate,
  taskProgressController.getTasks
);

/**
 * PUT /api/submissions/:submissionId/tasks/:taskId
 * Update task completion status
 * Auth: Required
 */
router.put(
  '/:submissionId/tasks/:taskId',
  authenticate,
  submissionIdValidation,
  taskIdValidation,
  updateTaskStatusValidation,
  validate,
  taskProgressController.updateTaskStatus
);

/**
 * GET /api/submissions/:submissionId/progress
 * Get progress information for a submission
 * Auth: Required
 */
router.get(
  '/:submissionId/progress',
  authenticate,
  submissionIdValidation,
  validate,
  taskProgressController.getProgress
);

/**
 * GET /api/submissions/:submissionId/status
 * Get AI review status and progress (polling fallback)
 * Auth: Required
 */
router.get(
  '/:submissionId/status',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.getSubmissionStatus
);

/**
 * GET /api/submissions/:submissionId/review-stream
 * Server-Sent Events stream for real-time review progress
 * Prefer this over polling /status
 * Auth: Required
 */
router.get(
  '/:submissionId/review-stream',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.streamReviewStatus
);

/**
 * GET /api/submissions/:submissionId/review
 * Get full AI review details
 * Auth: Required
 */
router.get(
  '/:submissionId/review',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.getReviewDetails
);

/**
 * GET /api/submissions/:submissionId/review/categories
 * Get review category breakdown
 * Auth: Required
 */
router.get(
  '/:submissionId/review/categories',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.getReviewCategories
);

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

/**
 * POST /api/submissions/:submissionId/fetch-pr
 * Manually fetch PR number from GitHub (diagnostic endpoint)
 * Auth: Required
 */
router.post(
  '/:submissionId/fetch-pr',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.fetchAndAttachPR
);

/**
 * PATCH /api/submissions/:submissionId/repo-url
 * Update repository URL (allowed when IN_PROGRESS or SUBMITTED)
 * Auth: Required
 */
router.patch(
  '/:submissionId/repo-url',
  authenticate,
  submissionIdValidation,
  validate,
  submissionController.updateRepoUrl
);

/**
 * Reflection routes (Phase 3)
 * GET  /api/submissions/:submissionId/reflection         — fetch questions
 * POST /api/submissions/:submissionId/reflection         — submit answers
 * GET  /api/submissions/:submissionId/reflection/result  — cross-check result
 */
const reflectionRouter = require('./reflection.routes');
router.use('/:id/reflection', (req, res, next) => {
  // Copy submissionId param to :id for mergeParams compatibility
  req.params.id = req.params.submissionId || req.params.id;
  next();
}, reflectionRouter);

module.exports = router;

