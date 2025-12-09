const express = require('express');
const router = express.Router();

const taskProgressController = require('../controllers/taskProgress.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  submissionIdValidation,
  taskIdValidation,
  updateTaskStatusValidation,
} = require('../dto/taskProgress.dto');

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

module.exports = router;

