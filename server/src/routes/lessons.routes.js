const express = require('express');
const router = express.Router();

const lessonsController = require('../controllers/lessons.controller');
const { authenticate } = require('../middlewares/auth.middleware');

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
router.post('/:id/complete', authenticate, lessonsController.completeLesson);

module.exports = router;
