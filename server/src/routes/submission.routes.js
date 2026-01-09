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
 * Auth: Required
 */
router.post(
  '/:submissionId/submit',
  authenticate,
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

