const submissionRepo = require('../repositories/submission.repo');
const projectRepo = require('../repositories/project.repo');
const projectService = require('./project.service');
const userRepo = require('../repositories/user.repo');

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
    repoUrl: submission.repoUrl,
    prNumber: submission.prNumber,
    status: submission.status,
    latestReview: latestReview,
    score: submission.score ? {
      codeQuality: submission.score.codeQuality,
      devopsExecution: submission.score.devopsExecution,
      reliability: submission.score.reliability,
      deliverySpeed: submission.score.deliverySpeed,
      collaboration: submission.score.collaboration,
      totalScore: submission.score.totalScore,
    } : null,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
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
  startSubmission,
  getSubmission,
};

