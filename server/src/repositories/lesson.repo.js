const prisma = require('../prisma/client');

/**
 * Count completed lessons for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of completed lessons
 */
async function countCompletedForUser(userId) {
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
async function countAll() {
  const count = await prisma.lesson.count();
  return count;
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
  const total = await countAll();

  return {
    progress,
    completed,
    total,
  };
}

module.exports = {
  countCompletedForUser,
  countAll,
  getUserProgress,
};

