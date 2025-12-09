const taskProgressRepo = require('../repositories/taskProgress.repo');
const projectRepo = require('../repositories/project.repo');
const submissionRepo = require('../repositories/submission.repo');

/**
 * Initialize task progress records for a submission
 * Creates TaskProgress records for all tasks in the project
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Array>} Array of created task progress records
 */
async function initializeTasks(submissionId) {
  // Get submission to find project
  const submission = await submissionRepo.findById(submissionId);
  
  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    error.code = 'SUBMISSION_NOT_FOUND';
    throw error;
  }

  // Get project to access tasksJson
  const project = await projectRepo.findById(submission.projectId);
  
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'PROJECT_NOT_FOUND';
    throw error;
  }

  // Parse tasks from project
  let tasks = [];
  if (project.tasksJson) {
    try {
      tasks = typeof project.tasksJson === 'string' 
        ? JSON.parse(project.tasksJson) 
        : project.tasksJson;
      
      if (!Array.isArray(tasks)) {
        tasks = [];
      }
    } catch (error) {
      // If parsing fails, use empty array
      tasks = [];
    }
  }

  // Create task progress records
  return taskProgressRepo.createForSubmission(submissionId, tasks);
}

/**
 * Get task progress for a submission with project tasks merged
 * @param {string} submissionId - Submission ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Tasks with completion status and progress
 */
async function getTaskProgress(submissionId, userId) {
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

  // Get project to access tasksJson
  const project = await projectRepo.findById(submission.projectId);
  
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'PROJECT_NOT_FOUND';
    throw error;
  }

  // Parse tasks from project
  let tasks = [];
  if (project.tasksJson) {
    try {
      tasks = typeof project.tasksJson === 'string' 
        ? JSON.parse(project.tasksJson) 
        : project.tasksJson;
      
      if (!Array.isArray(tasks)) {
        tasks = [];
      }
    } catch (error) {
      tasks = [];
    }
  }

  // Get task progress records
  const taskProgressRecords = await taskProgressRepo.findBySubmission(submissionId);
  
  // Create a map of taskId -> progress for quick lookup
  const progressMap = new Map();
  taskProgressRecords.forEach((progress) => {
    progressMap.set(progress.taskId, progress);
  });

  // Merge tasks with progress status
  const tasksWithProgress = tasks.map((task) => {
    const taskId = task.id || task.taskId || `task-${tasks.indexOf(task)}`;
    const progress = progressMap.get(taskId);
    
    return {
      id: taskId,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      points: task.points || 0,
      completed: progress ? progress.completed : false,
      completedAt: progress ? progress.completedAt : null,
    };
  });

  // Calculate overall progress
  const completedCount = await taskProgressRepo.countCompleted(submissionId);
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;

  return {
    tasks: tasksWithProgress,
    progress: {
      completed: completedCount,
      total: totalCount,
      percentage: progressPercentage,
    },
  };
}

/**
 * Update task completion status
 * @param {string} submissionId - Submission ID
 * @param {string} taskId - Task ID
 * @param {boolean} completed - Completion status
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Updated task progress record
 */
async function updateTaskStatus(submissionId, taskId, completed, userId) {
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

  // Update task status
  if (completed) {
    return taskProgressRepo.markComplete(submissionId, taskId);
  } else {
    return taskProgressRepo.markIncomplete(submissionId, taskId);
  }
}

/**
 * Calculate progress for a submission
 * @param {string} submissionId - Submission ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Progress information
 */
async function calculateProgress(submissionId, userId) {
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

  const completed = await taskProgressRepo.countCompleted(submissionId);
  const total = await taskProgressRepo.countTotal(submissionId);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percentage,
  };
}

/**
 * Validate if all tasks are completed
 * @param {string} submissionId - Submission ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<boolean>} True if all tasks are completed
 */
async function validateAllTasksComplete(submissionId, userId) {
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

  return taskProgressRepo.areAllTasksComplete(submissionId);
}

module.exports = {
  initializeTasks,
  getTaskProgress,
  updateTaskStatus,
  calculateProgress,
  validateAllTasksComplete,
};

