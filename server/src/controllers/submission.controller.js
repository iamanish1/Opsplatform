const submissionService = require('../services/submission.service');
const githubService = require('../services/github.service');
const submissionRepo = require('../repositories/submission.repo');
const logger = require('../utils/logger');

/**
 * GET /api/submissions
 * Get all submissions for the current user
 * Auth: Required
 */
async function getSubmissions(req, res, next) {
  try {
    const userId = req.user.id;
    
    const submissions = await submissionService.getSubmissionsByUserId(userId);
    
    res.json(submissions);
  } catch (error) {
    next(error);
  }
}

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

/**
 * POST /api/submissions/:submissionId/fetch-pr
 * Manually fetch and attach PR information from GitHub
 * Uses cascading fallback mechanism: primary + diagnostic
 * Auth: Required (must be submission owner)
 */
async function fetchAndAttachPR(req, res, next) {
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

    // Fetch submission from database
    const submission = await submissionRepo.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Submission not found',
        },
      });
    }

    // Verify ownership
    if (submission.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access to submission',
        },
      });
    }

    // If PR already attached, return success
    if (submission.prNumber) {
      return res.json({
        success: true,
        message: 'PR already attached to submission',
        submission: {
          id: submission.id,
          prNumber: submission.prNumber,
          repoUrl: submission.repoUrl,
          status: submission.status,
        },
      });
    }

    // Parse GitHub URL to extract owner/repo
    const { owner, repo } = githubService.parseGitHubUrl(submission.repoUrl);

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPO_URL',
          message: 'Invalid GitHub repository URL format',
        },
      });
    }

    logger.info(
      { submissionId, repoUrl: submission.repoUrl },
      'Manual PR fetch initiated - using cascading fallback mechanism'
    );

    // Cascading PR fetching mechanism
    // 1. Try primary mechanism with shorter timeout (for manual/quick fetch)
    let prNumber = await githubService.findLatestOpenPR(submission.repoUrl, 10000); // 10 seconds

    // 2. If primary fails, automatically trigger diagnostic mechanism
    if (!prNumber) {
      logger.info(
        { submissionId },
        'Manual fetch: primary mechanism failed, triggering diagnostic mechanism'
      );
      prNumber = await githubService.findPRWithDiagnostic(submission.repoUrl, 30000); // 30 seconds for manual
    }

    // 3. Save to database if found
    if (!prNumber) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_PR_FOUND',
          message: 'No open pull requests found. Please ensure you have pushed code and created a PR on GitHub.',
        },
      });
    }

    // Attach PR to submission
    await submissionRepo.attachPR(submissionId, prNumber);
    logger.info({ submissionId, prNumber }, 'Successfully attached PR via manual diagnostic endpoint');

    res.json({
      success: true,
      message: `PR #${prNumber} successfully attached to submission`,
      submission: {
        id: submission.id,
        prNumber,
        repoUrl: submission.repoUrl,
        status: submission.status,
      },
    });
  } catch (error) {
    logger.error(`Error in manual PR fetch: ${error.message}`);

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

    // Generic error response for GitHub API errors
    res.status(500).json({
      success: false,
      error: {
        code: 'PR_FETCH_ERROR',
        message: 'Failed to fetch PR information from GitHub. Please try again later.',
      },
    });
  }
}

module.exports = {
  getSubmissions,
  getSubmission,
  submitForReview,
  fetchAndAttachPR,
};

