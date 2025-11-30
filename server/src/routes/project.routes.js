const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { startSubmissionValidation } = require('../dto/submission.start.dto');
const { projectIdValidation } = require('../dto/project.dto');

/**
 * GET /api/projects/:projectId
 * Get project details
 * Auth: Required
 */
router.get(
  '/:projectId',
  authenticate,
  projectIdValidation,
  validate,
  projectController.getProject
);

/**
 * POST /api/projects/:projectId/start
 * Start a project (create submission)
 * Auth: Required
 */
router.post('/:projectId/start', authenticate, startSubmissionValidation, validate, projectController.startProject);

module.exports = router;
