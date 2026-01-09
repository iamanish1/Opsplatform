const projectRepo = require('../repositories/project.repo');
const userRepo = require('../repositories/user.repo');
const lessonRepo = require('../repositories/lesson.repo');
const submissionRepo = require('../repositories/submission.repo');

/**
 * Get project details by ID
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID (optional, for submission lookup)
 * @returns {Promise<Object>} Project object with tasks and submission info if started
 */
async function getProject(projectId, userId = null) {
  const project = await projectRepo.findById(projectId);
  
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'PROJECT_NOT_FOUND';
    throw error;
  }
  
  // Parse tasksJson if it exists
  const tasks = project.tasksJson || [];
  
  // Get submission info if userId provided
  let submissionId = null;
  let submissionStatus = 'NOT_STARTED';
  if (userId) {
    const submission = await submissionRepo.findByUserAndProject(userId, projectId);
    if (submission) {
      submissionId = submission.id;
      submissionStatus = submission.status;
    }
  }
  
  // Parse tags if they exist
  let tags = [];
  if (project.tags) {
    try {
      tags = typeof project.tags === 'string' 
        ? JSON.parse(project.tags) 
        : project.tags;
      if (!Array.isArray(tags)) {
        tags = [];
      }
    } catch {
      tags = [];
    }
  }
  
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    starterRepo: project.starterRepo,
    tasks: tasks,
    tags: tags,
    submissionId: submissionId,
    submissionStatus: submissionStatus,
    createdAt: project.createdAt,
  };
}

/**
 * Validate if user is eligible to start a project
 * User must have:
 * 1. GitHub OAuth completed (githubId != null OR onboardingStep >= 1)
 * 2. All lessons completed (onboardingStep >= 2)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Eligibility status
 */
async function validateUserEligibility(userId) {
  // Get user
  const user = await userRepo.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }
  
  // Check GitHub OAuth completion
  const hasGitHubOAuth = user.githubId != null || user.onboardingStep >= 1;
  
  if (!hasGitHubOAuth) {
    return {
      eligible: false,
      reason: 'GitHub OAuth not completed',
      code: 'NOT_ELIGIBLE',
    };
  }
  
  // Check lessons completion (onboardingStep >= 2 means all lessons done)
  const hasCompletedLessons = user.onboardingStep >= 2;
  
  if (!hasCompletedLessons) {
    // Double-check by counting lessons
    const completedCount = await lessonRepo.countLessonsCompleted(userId);
    const totalCount = await lessonRepo.countTotalLessons();
    
    if (completedCount !== totalCount || totalCount === 0) {
      return {
        eligible: false,
        reason: 'All lessons must be completed before starting project',
        code: 'NOT_ELIGIBLE',
      };
    }
  }
  
  return {
    eligible: true,
  };
}

/**
 * Get all projects with user's submission status and lock status
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of projects with submission status, lock status, and progress
 */
async function getProjectsWithSubmissionStatus(userId) {
  // Get all projects
  const projects = await projectRepo.findAll();
  
  // Get all user submissions
  const userSubmissions = await submissionRepo.findByUserId(userId);
  
  // Create a map of projectId -> submission for quick lookup
  const submissionMap = new Map();
  userSubmissions.forEach((submission) => {
    submissionMap.set(submission.projectId, submission);
  });
  
  // Check user eligibility once (handle errors gracefully)
  let isEligible = false;
  try {
    const eligibility = await validateUserEligibility(userId);
    isEligible = eligibility.eligible;
  } catch (error) {
    // If user not found or other error, assume not eligible (all projects locked)
    isEligible = false;
  }
  
  // Merge projects with submission status
  return projects.map((project) => {
    const submission = submissionMap.get(project.id);
    const submissionStatus = submission ? submission.status : 'NOT_STARTED';
    
    // Determine lock status
    const locked = !isEligible;
    
    // Calculate progress based on submission status
    // For now, we'll use a simple mapping:
    // NOT_STARTED: 0%, IN_PROGRESS: 25%, SUBMITTED: 75%, REVIEWED: 100%
    let progress = 0;
    switch (submissionStatus) {
      case 'REVIEWED':
        progress = 100;
        break;
      case 'SUBMITTED':
        progress = 75;
        break;
      case 'IN_PROGRESS':
        progress = 25;
        break;
      case 'NOT_STARTED':
      default:
        progress = 0;
        break;
    }
    
    // Parse tags if they exist
    let tags = [];
    if (project.tags) {
      try {
        tags = typeof project.tags === 'string' 
          ? JSON.parse(project.tags) 
          : project.tags;
        if (!Array.isArray(tags)) {
          tags = [];
        }
      } catch {
        tags = [];
      }
    }
    
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      starterRepo: project.starterRepo,
      tags: tags,
      submissionStatus: submissionStatus,
      locked: locked,
      progress: progress,
      submissionId: submission ? submission.id : null,
      createdAt: project.createdAt,
    };
  });
}

module.exports = {
  getProject,
  validateUserEligibility,
  getProjectsWithSubmissionStatus,
};
