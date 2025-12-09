const submissionService = require('../services/submission.service');

/**
 * GET /api/submissions/:submissionId
 * Get submission details
 * Auth: Required
 */
async function getSubmission(req, res, next) {
  try {
    const submissionId = req.params.submissionId;
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
    
    const submission = await submissionService.getSubmission(submissionId, userId);
    
    res.json(submission);
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
 * POST /api/submissions/:submissionId/submit
 * Submit project for review (all tasks must be complete)
 * Auth: Required
 */
async function submitForReview(req, res, next) {
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

    const result = await submissionService.submitForReview(submissionId, userId);

    res.json({
      success: true,
      ...result,
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

    if (error.code === 'TASKS_INCOMPLETE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TASKS_INCOMPLETE',
          message: error.message || 'All tasks must be completed before submitting for review',
        },
      });
    }

    next(error);
  }
}

module.exports = {
  getSubmission,
  submitForReview,
};

