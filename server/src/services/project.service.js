const projectRepo = require('../repositories/project.repo');
const userRepo = require('../repositories/user.repo');
const lessonRepo = require('../repositories/lesson.repo');

/**
 * Get project details by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project object with tasks
 */
async function getProject(projectId) {
  const project = await projectRepo.findById(projectId);
  
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'PROJECT_NOT_FOUND';
    throw error;
  }
  
  // Parse tasksJson if it exists
  const tasks = project.tasksJson || [];
  
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    starterRepo: project.starterRepo,
    tasks: tasks,
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

module.exports = {
  getProject,
  validateUserEligibility,
};
