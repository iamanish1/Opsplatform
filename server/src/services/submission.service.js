const submissionRepo = require('../repositories/submission.repo');
const projectRepo = require('../repositories/project.repo');
const projectService = require('./project.service');
const userRepo = require('../repositories/user.repo');
const taskProgressService = require('./taskProgress.service');
const githubService = require('./github.service');
const logger = require('../utils/logger');

/**
 * Get all submissions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of submissions with project and score data
 */
async function getSubmissionsByUserId(userId) {
  const submissions = await submissionRepo.findByUserId(userId);
  
  // Format response
  return submissions.map((submission) => ({
    id: submission.id,
    projectId: submission.projectId,
    project: submission.project ? {
      id: submission.project.id,
      title: submission.project.title,
      description: submission.project.description,
    } : null,
    repoUrl: submission.repoUrl,
    prNumber: submission.prNumber,
    status: submission.status,
    score: submission.score ? {
      codeQuality: submission.score.codeQuality,
      problemSolving: submission.score.problemSolving,
      bugRisk: submission.score.bugRisk,
      devopsExecution: submission.score.devopsExecution,
      optimization: submission.score.optimization,
      documentation: submission.score.documentation,
      gitMaturity: submission.score.gitMaturity,
      collaboration: submission.score.collaboration,
      deliverySpeed: submission.score.deliverySpeed,
      security: submission.score.security,
      totalScore: submission.score.totalScore,
      badge: submission.score.badge,
    } : null,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  }));
}

/**
 * Validate repository URL format
 * @param {string} repoUrl - Repository URL
 * @returns {boolean} True if valid
 */
function validateRepoUrl(repoUrl) {
  if (!repoUrl || typeof repoUrl !== 'string') {
    return false;
  }
  
  // Must start with https://github.com/
  if (!repoUrl.startsWith('https://github.com/')) {
    return false;
  }
  
  // Must be valid URL format
  try {
    const url = new URL(repoUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
      return false;
    }
  } catch (e) {
    return false;
  }
  
  // Max length 255 characters
  if (repoUrl.length > 255) {
    return false;
  }
  
  return true;
}

/**
 * Start a new submission for a project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} repoUrl - Repository URL
 * @returns {Promise<Object>} Submission data with onboarding step update status
 */
async function startSubmission(userId, projectId, repoUrl) {
  // Validate user eligibility
  const eligibility = await projectService.validateUserEligibility(userId);
  
  if (!eligibility.eligible) {
    const error = new Error(eligibility.reason || 'User is not eligible to start project');
    error.statusCode = 403;
    error.code = eligibility.code || 'NOT_ELIGIBLE';
    throw error;
  }
  
  // Validate project exists
  const project = await projectRepo.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'PROJECT_NOT_FOUND';
    throw error;
  }
  
  // Validate repoUrl format
  if (!validateRepoUrl(repoUrl)) {
    const error = new Error('Invalid repository URL. Must be a valid GitHub URL starting with https://github.com/');
    error.statusCode = 400;
    error.code = 'INVALID_REPO_URL';
    throw error;
  }
  
  // Check for existing submission (prevent duplicates)
  const existingSubmission = await submissionRepo.findByUserAndProject(userId, projectId);
  
  if (existingSubmission) {
    // Return existing submission (graceful handling)
    return {
      submissionId: existingSubmission.id,
      status: existingSubmission.status,
      projectId: existingSubmission.projectId,
      repoUrl: existingSubmission.repoUrl,
      onboardingStepUpdated: false, // Already updated
    };
  }
  
  // Create new submission
  const submission = await submissionRepo.create(userId, projectId, repoUrl);
  
  // Initialize task progress records for this submission
  try {
    await taskProgressService.initializeTasks(submission.id);
  } catch (error) {
    // Log error but don't fail submission creation
    // Task progress initialization can be retried later
    console.error('Failed to initialize task progress:', error);
  }
  
  // Update user onboarding step to 3
  await userRepo.update(userId, { onboardingStep: 3 });
  
  return {
    submissionId: submission.id,
    status: submission.status,
    projectId: submission.projectId,
    repoUrl: submission.repoUrl,
    onboardingStepUpdated: true,
  };
}

/**
 * Get submission details with relations
 * @param {string} submissionId - Submission ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Submission details with score and latest review
 */
async function getSubmission(submissionId, userId) {
  const submission = await submissionRepo.findById(submissionId);
  
  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    error.code = 'SUBMISSION_NOT_FOUND';
    throw error;
  }
  
  // Verify user owns the submission (security check)
  if (submission.userId !== userId) {
    const error = new Error('Unauthorized access to submission');
    error.statusCode = 403;
    error.code = 'UNAUTHORIZED';
    throw error;
  }
  
  // Compute latest review data
  let latestReview = null;
  if (submission.reviews && submission.reviews.length > 0) {
    const review = submission.reviews[0]; // Already ordered by createdAt desc, take 1
    latestReview = {
      totalScore: submission.score ? submission.score.totalScore : null,
      badge: getBadgeFromScore(submission.score ? submission.score.totalScore : 0),
    };
  } else if (submission.score) {
    latestReview = {
      totalScore: submission.score.totalScore,
      badge: getBadgeFromScore(submission.score.totalScore),
    };
  }
  
  // Format response
  return {
    id: submission.id,
    projectId: submission.projectId,
    project: submission.project ? {
      id: submission.project.id,
      title: submission.project.title,
      description: submission.project.description,
    } : null,
    repoUrl: submission.repoUrl,
    prNumber: submission.prNumber,
    status: submission.status,
    latestReview: latestReview,
    score: submission.score ? {
      codeQuality: submission.score.codeQuality,
      problemSolving: submission.score.problemSolving,
      bugRisk: submission.score.bugRisk,
      devopsExecution: submission.score.devopsExecution,
      optimization: submission.score.optimization,
      documentation: submission.score.documentation,
      gitMaturity: submission.score.gitMaturity,
      collaboration: submission.score.collaboration,
      deliverySpeed: submission.score.deliverySpeed,
      security: submission.score.security,
      reliability: submission.score.reliability,
      totalScore: submission.score.totalScore,
      badge: submission.score.badge,
    } : null,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

/**
 * Submit project for review (all tasks must be complete)
 * @param {string} submissionId - Submission ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Submission result with updated status
 */
async function submitForReview(submissionId, userId) {
  // Verify submission exists and user owns it
  const submission = await submissionRepo.findById(submissionId);
  
  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    error.code = 'SUBMISSION_NOT_FOUND';
    throw error;
  }

  if (submission.userId !== userId) {
    const error = new Error('Unauthorized access to submission');
    error.statusCode = 403;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  // Check if already submitted or reviewed
  if (submission.status === 'SUBMITTED' || submission.status === 'REVIEWED') {
    return {
      submissionId: submission.id,
      status: submission.status,
      message: submission.status === 'REVIEWED' 
        ? 'Project has already been reviewed' 
        : 'Project is already submitted for review',
    };
  }

  // Validate all tasks are complete
  const allTasksComplete = await taskProgressService.validateAllTasksComplete(submissionId, userId);
  
  if (!allTasksComplete) {
    const error = new Error('All tasks must be completed before submitting for review');
    error.statusCode = 400;
    error.code = 'TASKS_INCOMPLETE';
    throw error;
  }

  // Update status to SUBMITTED
  await submissionRepo.updateStatus(submissionId, 'SUBMITTED');

  // Cascading PR fetching mechanism:
  // 1. Try primary mechanism (30 second timeout with 5s intervals)
  // 2. If that fails, automatically trigger diagnostic mechanism (60 second timeout)
  // 3. Save PR info to database once found
  // 4. Non-blocking - doesn't fail submission
  if (!submission.prNumber && submission.repoUrl) {
    try {
      logger.info({ submissionId, repoUrl: submission.repoUrl }, 'Starting cascading PR fetch mechanism');
      
      // Primary mechanism: Try to find PR with moderate timeout
      let prNumber = await githubService.findLatestOpenPR(submission.repoUrl, 30000);
      
      if (!prNumber) {
        // Primary failed - automatically trigger diagnostic mechanism
        logger.info(
          { submissionId, repoUrl: submission.repoUrl },
          'Primary PR fetch failed, triggering diagnostic mechanism'
        );
        
        // Diagnostic mechanism: More aggressive retry with longer timeout
        prNumber = await githubService.findPRWithDiagnostic(submission.repoUrl, 60000);
      }
      
      // Save PR to database if found
      if (prNumber) {
        await submissionRepo.attachPR(submissionId, prNumber);
        logger.info(
          { submissionId, prNumber, repoUrl: submission.repoUrl },
          'Successfully attached PR number to submission'
        );
      } else {
        logger.warn(
          { submissionId, repoUrl: submission.repoUrl },
          'Both primary and diagnostic mechanisms failed to find PR. User may need to manually trigger or check PR status.'
        );
      }
    } catch (error) {
      // Non-blocking - log error but don't fail submission
      logger.error(
        { error: error.message, submissionId, repoUrl: submission.repoUrl },
        'Error in PR fetching mechanism'
      );
    }
  }

  // TODO: Trigger AI review process here
  // This will be implemented later to:
  // 1. Analyze the repository
  // 2. Run code quality checks
  // 3. Generate scores
  // 4. Create portfolio
  // 5. Generate certificate

  // Fetch updated submission to include PR information in response
  const updatedSubmission = await submissionRepo.findById(submissionId);

  return {
    submissionId: submission.id,
    status: 'SUBMITTED',
    message: 'Project submitted for review successfully. Your project will be reviewed by our AI engine.',
    submission: {
      id: updatedSubmission.id,
      status: updatedSubmission.status,
      prNumber: updatedSubmission.prNumber,
      repoUrl: updatedSubmission.repoUrl,
      prAttached: !!updatedSubmission.prNumber,
    },
  };
}

/**
 * Get badge from total score
 * @param {number} totalScore - Total score
 * @returns {string} Badge color
 */
function getBadgeFromScore(totalScore) {
  if (totalScore >= 80) {
    return 'GREEN';
  } else if (totalScore >= 60) {
    return 'YELLOW';
  } else {
    return 'RED';
  }
}

module.exports = {
  getSubmissionsByUserId,
  startSubmission,
  getSubmission,
  submitForReview,
};

