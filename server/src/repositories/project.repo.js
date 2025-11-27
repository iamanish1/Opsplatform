const prisma = require('../prisma/client');

/**
 * Find project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>} Project object or null
 */
async function findById(projectId) {
  return prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
}

/**
 * Find all projects
 * @returns {Promise<Array>} Array of projects
 */
async function findAll() {
  return prisma.project.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });
}

module.exports = {
  findById,
  findAll,
};
