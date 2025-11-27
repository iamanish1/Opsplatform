const prisma = require('../prisma/client');

/**
 * Find all lessons ordered by order field
 * @returns {Promise<Array>} Array of lessons
 */
async function findAllLessons() {
  return prisma.lesson.findMany({
    orderBy: {
      order: 'asc',
    },
  });
}

/**
 * Find lesson by ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object|null>} Lesson object or null
 */
async function findById(lessonId) {
  return prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
  });
}

/**
 * Get all lesson progress records for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of lesson progress records
 */
async function getUserLessonProgress(userId) {
  return prisma.lessonProgress.findMany({
    where: {
      userId,
    },
  });
}

/**
 * Get specific lesson progress for a user
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object|null>} Lesson progress or null
 */
async function getLessonProgress(userId, lessonId) {
  return prisma.lessonProgress.findFirst({
    where: {
      userId,
      lessonId,
    },
  });
}

/**
 * Complete a lesson for a user (idempotent - create or update)
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Updated or created lesson progress
 */
async function completeLesson(userId, lessonId) {
  // Find existing progress
  const existing = await prisma.lessonProgress.findFirst({
    where: {
      userId,
      lessonId,
    },
  });

  const now = new Date();

  if (existing) {
    // Update existing progress
    return prisma.lessonProgress.update({
      where: {
        id: existing.id,
      },
      data: {
        completed: true,
        completedAt: now,
      },
    });
  } else {
    // Create new progress
    return prisma.lessonProgress.create({
      data: {
        userId,
        lessonId,
        completed: true,
        completedAt: now,
      },
    });
  }
}

/**
 * Count completed lessons for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of completed lessons
 */
async function countLessonsCompleted(userId) {
  const count = await prisma.lessonProgress.count({
    where: {
      userId,
      completed: true,
    },
  });
  return count;
}

/**
 * Count total lessons available
 * @returns {Promise<number>} Total count of lessons
 */
async function countTotalLessons() {
  const count = await prisma.lesson.count();
  return count;
}

/**
 * Count completed lessons for a user (alias for backward compatibility)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of completed lessons
 */
async function countCompletedForUser(userId) {
  return countLessonsCompleted(userId);
}

/**
 * Count total lessons available (alias for backward compatibility)
 * @returns {Promise<number>} Total count of lessons
 */
async function countAll() {
  return countTotalLessons();
}

/**
 * Get detailed progress for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Progress details
 */
async function getUserProgress(userId) {
  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId,
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
    orderBy: {
      lesson: {
        order: 'asc',
      },
    },
  });

  const completed = progress.filter((p) => p.completed).length;
  const total = await countTotalLessons();

  return {
    progress,
    completed,
    total,
  };
}

module.exports = {
  findAllLessons,
  findById,
  getUserLessonProgress,
  getLessonProgress,
  completeLesson,
  countLessonsCompleted,
  countTotalLessons,
  // Backward compatibility aliases
  countCompletedForUser,
  countAll,
  getUserProgress,
};

