const lessonsService = require('../services/lessons.service');

/**
 * GET /api/lessons
 * Get all lessons with user's completion status
 * Auth: Required
 */
async function getLessons(req, res, next) {
  try {
    const userId = req.user.id;
    const lessons = await lessonsService.getLessonsWithProgress(userId);
    
    res.json(lessons);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/lessons/:id
 * Get single lesson details with completion status
 * Auth: Required
 */
async function getLessonDetails(req, res, next) {
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;
    
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Lesson ID is required',
        },
      });
    }
    
    const lesson = await lessonsService.getLessonDetails(lessonId, userId);
    
    res.json(lesson);
  } catch (error) {
    if (error.code === 'LESSON_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: 'Lesson not found',
        },
      });
    }
    next(error);
  }
}

/**
 * POST /api/lessons/:id/complete
 * Mark lesson as complete for the current user
 * Auth: Required
 */
async function completeLesson(req, res, next) {
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;
    
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Lesson ID is required',
        },
      });
    }
    
    const result = await lessonsService.completeLesson(userId, lessonId);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.code === 'LESSON_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: 'Lesson not found',
        },
      });
    }
    next(error);
  }
}

module.exports = {
  getLessons,
  getLessonDetails,
  completeLesson,
};
