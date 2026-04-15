const submissionService = require('../services/submission.service');
const githubService = require('../services/github.service');
const submissionRepo = require('../repositories/submission.repo');
const prReviewRepo = require('../repositories/prReview.repo');
const userRepo = require('../repositories/user.repo');
const logger = require('../utils/logger');

function calculateReviewProgress(submission) {
  if (submission.status === 'REVIEWED') {
    return 100;
  }

  if (submission.status === 'SUBMITTED' && submission.prNumber) {
    return 65;
  }

  if (submission.status === 'SUBMITTED') {
    return 25;
  }

  return 0;
}

function buildCategories(score) {
  if (!score) {
    return [];
  }

  const labels = {
    codeQuality: 'Code Quality',
    problemSolving: 'Problem Solving',
    bugRisk: 'Bug Risk',
    devopsExecution: 'DevOps Execution',
    optimization: 'Optimization',
    documentation: 'Documentation',
    gitMaturity: 'Git Maturity',
    collaboration: 'Collaboration',
    deliverySpeed: 'Delivery Speed',
    security: 'Security',
  };

  const breakdown = score.detailsJson?.breakdown || {};

  return Object.entries(labels).map(([key, label]) => ({
    id: key,
    name: label,
    score: breakdown[key] ?? score[key] ?? 0,
    maxScore: 10,
  }));
}

function formatReviewResponse(submission, review) {
  const score = submission.score;
  const details = score?.detailsJson || {};
  const reviewJson = review?.reviewJson || {};

  return {
    id: review?.id || null,
    submissionId: submission.id,
    status: submission.status,
    progress: calculateReviewProgress(submission),
    trustScore: score?.totalScore ?? null,
    badge: score?.badge ?? null,
    categories: buildCategories(score),
    summary: details.summary || reviewJson.summary || null,
    suggestions: details.suggestions || review?.suggestions || reviewJson.suggestions || [],
    staticAnalysis: review?.staticReport || details.raw?.staticReport || null,
    evidence: details.evidence || [],
    prNumber: submission.prNumber,
    createdAt: review?.createdAt || null,
    updatedAt: submission.updatedAt,
  };
}

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
 * GET /api/submissions/:submissionId/status
 * Get AI review status and progress
 * Auth: Required
 */
async function getSubmissionStatus(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' } });
    }
    if (submission.userId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access to submission' } });
    }

    const review = await prReviewRepo.findBySubmissionId(submissionId);
    const status = submission.status === 'REVIEWED'
      ? 'REVIEWED'
      : submission.status === 'SUBMITTED'
        ? 'REVIEWING'
        : 'PENDING';

    res.json({
      submissionId: submission.id,
      status,
      progress: calculateReviewProgress(submission),
      prNumber: submission.prNumber,
      hasReview: !!review,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/:submissionId/review
 * Get full AI review details
 * Auth: Required
 */
async function getReviewDetails(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' } });
    }
    if (submission.userId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access to submission' } });
    }

    const review = await prReviewRepo.findBySubmissionId(submissionId);
    if (submission.status !== 'REVIEWED' || !review || !submission.score) {
      return res.status(202).json(formatReviewResponse(submission, review));
    }

    res.json(formatReviewResponse(submission, review));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/:submissionId/review/categories
 * Get category breakdown for a reviewed submission
 * Auth: Required
 */
async function getReviewCategories(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' } });
    }
    if (submission.userId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access to submission' } });
    }

    res.json(buildCategories(submission.score));
  } catch (error) {
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
      const user = await userRepo.findById(userId);
      submissionService.triggerReviewAsync({
        submissionId,
        repoUrl: submission.repoUrl,
        prNumber: submission.prNumber,
        userGithubInstallId: user?.githubInstallId,
        userGithubToken: user?.githubToken,
      });

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

    // Get user's GitHub token for this operation
    const user = await userRepo.findById(userId);
    const userGithubToken = user?.githubToken;
    
    if (!userGithubToken) {
      logger.warn({ userId, submissionId }, 'User has no GitHub token. PR fetching will use public API only.');
    }

    // Cascading PR fetching mechanism
    // 1. Try primary mechanism with shorter timeout (for manual/quick fetch) - use user's token if available
    let prNumber = await githubService.findLatestOpenPR(submission.repoUrl, userGithubToken, 10000); // 10 seconds

    // 2. If primary fails, automatically trigger diagnostic mechanism - use user's token if available
    if (!prNumber) {
      logger.info(
        { submissionId },
        'Manual fetch: primary mechanism failed, triggering diagnostic mechanism'
      );
      prNumber = await githubService.findPRWithDiagnostic(submission.repoUrl, userGithubToken, 30000); // 30 seconds for manual
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

    submissionService.triggerReviewAsync({
      submissionId,
      repoUrl: submission.repoUrl,
      prNumber,
      userGithubInstallId: user?.githubInstallId,
      userGithubToken,
    });

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

/**
 * PATCH /api/submissions/:submissionId/repo-url
 * Update the repository URL for a submission (only allowed when IN_PROGRESS)
 */
async function updateRepoUrl(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const { repoUrl } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REPO_URL', message: 'repoUrl is required' } });
    }

    const trimmed = repoUrl.trim();
    if (!trimmed.startsWith('https://github.com/')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REPO_URL', message: 'Must be a valid GitHub URL starting with https://github.com/' } });
    }

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) return res.status(404).json({ success: false, error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' } });
    if (submission.userId !== userId) return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    if (submission.status === 'REVIEWED') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_REVIEWED', message: 'Cannot change repo URL after review is complete' } });
    }

    const updated = await submissionRepo.updateRepoUrl(submissionId, trimmed);
    logger.info({ submissionId, repoUrl: trimmed }, 'Repo URL updated by user');

    res.json({ success: true, message: 'Repository URL updated successfully', submission: { id: updated.id, repoUrl: updated.repoUrl, prNumber: updated.prNumber } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubmissions,
  getSubmission,
  submitForReview,
  getSubmissionStatus,
  getReviewDetails,
  getReviewCategories,
  fetchAndAttachPR,
  updateRepoUrl,
};

