const express = require('express');
const router = express.Router();

const lessonsController = require('../controllers/lessons.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { lessonIdValidation } = require('../dto/lesson.dto');

/**
 * GET /api/lessons
 * Get all lessons with user's completion status
 * Auth: Required
 */
router.get('/', authenticate, lessonsController.getLessons);

/**
 * GET /api/lessons/:id
 * Get single lesson details with completion status
 * Auth: Required
 */
router.get('/:id', authenticate, lessonsController.getLessonDetails);

/**
 * POST /api/lessons/:id/complete
 * Mark lesson as complete for the current user
 * Auth: Required
 */
router.post(
  '/:id/complete',
  authenticate,
  lessonIdValidation,
  validate,
  lessonsController.completeLesson
);

module.exports = router;
