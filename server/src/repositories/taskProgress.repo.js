const prisma = require('../prisma/client');

/**
 * Create task progress records for all tasks in a project
 * @param {string} submissionId - Submission ID
 * @param {Array} tasks - Array of tasks from project.tasksJson
 * @returns {Promise<Array>} Array of created task progress records
 */
async function createForSubmission(submissionId, tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  // Create task progress records for all tasks
  const taskProgressData = tasks.map((task) => ({
    submissionId,
    taskId: task.id || task.taskId || `task-${tasks.indexOf(task)}`,
    completed: false,
  }));

  // Use createMany for better performance
  await prisma.taskProgress.createMany({
    data: taskProgressData,
    skipDuplicates: true, // Skip if already exists
  });

  // Return the created records
  return prisma.taskProgress.findMany({
    where: {
      submissionId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Find all task progress records for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Array>} Array of task progress records
 */
async function findBySubmission(submissionId) {
  return prisma.taskProgress.findMany({
    where: {
      submissionId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Find task progress by submission and task ID
 * @param {string} submissionId - Submission ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object|null>} Task progress record or null
 */
async function findBySubmissionAndTask(submissionId, taskId) {
  return prisma.taskProgress.findUnique({
    where: {
      submissionId_taskId: {
        submissionId,
        taskId,
      },
    },
  });
}

/**
 * Mark a task as complete
 * @param {string} submissionId - Submission ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task progress record
 */
async function markComplete(submissionId, taskId) {
  const now = new Date();

  return prisma.taskProgress.upsert({
    where: {
      submissionId_taskId: {
        submissionId,
        taskId,
      },
    },
    update: {
      completed: true,
      completedAt: now,
    },
    create: {
      submissionId,
      taskId,
      completed: true,
      completedAt: now,
    },
  });
}

/**
 * Mark a task as incomplete
 * @param {string} submissionId - Submission ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task progress record
 */
async function markIncomplete(submissionId, taskId) {
  return prisma.taskProgress.update({
    where: {
      submissionId_taskId: {
        submissionId,
        taskId,
      },
    },
    data: {
      completed: false,
      completedAt: null,
    },
  });
}

/**
 * Count completed tasks for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<number>} Count of completed tasks
 */
async function countCompleted(submissionId) {
  return prisma.taskProgress.count({
    where: {
      submissionId,
      completed: true,
    },
  });
}

/**
 * Count total tasks for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<number>} Total count of tasks
 */
async function countTotal(submissionId) {
  return prisma.taskProgress.count({
    where: {
      submissionId,
    },
  });
}

/**
 * Check if all tasks are completed for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<boolean>} True if all tasks are completed
 */
async function areAllTasksComplete(submissionId) {
  const total = await countTotal(submissionId);
  if (total === 0) {
    return false; // No tasks means not complete
  }

  const completed = await countCompleted(submissionId);
  return completed === total;
}

/**
 * Calculate progress percentage for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<number>} Progress percentage (0-100)
 */
async function calculateProgress(submissionId) {
  const total = await countTotal(submissionId);
  if (total === 0) {
    return 0;
  }

  const completed = await countCompleted(submissionId);
  return Math.round((completed / total) * 100);
}

/**
 * Delete all task progress records for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<number>} Count of deleted records
 */
async function deleteBySubmission(submissionId) {
  const result = await prisma.taskProgress.deleteMany({
    where: {
      submissionId,
    },
  });
  return result.count;
}

module.exports = {
  createForSubmission,
  findBySubmission,
  findBySubmissionAndTask,
  markComplete,
  markIncomplete,
  countCompleted,
  countTotal,
  areAllTasksComplete,
  calculateProgress,
  deleteBySubmission,
};

