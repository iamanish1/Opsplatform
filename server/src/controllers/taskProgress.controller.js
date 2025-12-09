const taskProgressService = require('../services/taskProgress.service');

/**
 * GET /api/submissions/:submissionId/tasks
 * Get all tasks with completion status for a submission
 * Auth: Required
 */
async function getTasks(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Submission ID is required',
        },
      });
    }

    const result = await taskProgressService.getTaskProgress(submissionId, userId);

    res.json(result);
  } catch (error) {
    if (error.code === 'SUBMISSION_NOT_FOUND' || error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access to submission',
        },
      });
    }

    next(error);
  }
}

/**
 * PUT /api/submissions/:submissionId/tasks/:taskId
 * Update task completion status
 * Auth: Required
 */
async function updateTaskStatus(req, res, next) {
  try {
    const { submissionId, taskId } = req.params;
    const userId = req.user.id;
    const { completed } = req.body;

    if (!submissionId || !taskId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Submission ID and Task ID are required',
        },
      });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Completed status must be a boolean',
        },
      });
    }

    const taskProgress = await taskProgressService.updateTaskStatus(
      submissionId,
      taskId,
      completed,
      userId
    );

    // Get updated progress
    const progress = await taskProgressService.calculateProgress(submissionId, userId);

    res.json({
      success: true,
      task: taskProgress,
      progress,
    });
  } catch (error) {
    if (error.code === 'SUBMISSION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Submission not found',
        },
      });
    }

    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access to submission',
        },
      });
    }

    next(error);
  }
}

/**
 * GET /api/submissions/:submissionId/progress
 * Get progress information for a submission
 * Auth: Required
 */
async function getProgress(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Submission ID is required',
        },
      });
    }

    const progress = await taskProgressService.calculateProgress(submissionId, userId);

    res.json(progress);
  } catch (error) {
    if (error.code === 'SUBMISSION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Submission not found',
        },
      });
    }

    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access to submission',
        },
      });
    }

    next(error);
  }
}

module.exports = {
  getTasks,
  updateTaskStatus,
  getProgress,
};

