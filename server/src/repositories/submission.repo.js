const prisma = require('../prisma/client');

/**
 * Find submission by user and project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>} Submission object or null
 */
async function findByUserAndProject(userId, projectId) {
  return prisma.submission.findFirst({
    where: {
      userId,
      projectId,
    },
  });
}

/**
 * Create new submission
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} repoUrl - Repository URL
 * @returns {Promise<Object>} Created submission
 */
async function create(userId, projectId, repoUrl) {
  return prisma.submission.create({
    data: {
      userId,
      projectId,
      repoUrl,
      status: 'IN_PROGRESS',
    },
  });
}

/**
 * Update submission fields
 * @param {string} submissionId - Submission ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated submission
 */
async function update(submissionId, data) {
  return prisma.submission.update({
    where: {
      id: submissionId,
    },
    data,
  });
}

/**
 * Find submission by ID with relations
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Submission with relations or null
 */
async function findById(submissionId) {
  return prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      score: true,
      reviews: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1, // Get latest review
      },
    },
  });
}

/**
 * Find submission by repository URL (exact match)
 * Used by webhook to map PR events to submissions
 * @param {string} repoUrl - Repository URL
 * @returns {Promise<Object|null>} Submission or null
 */
async function findByRepoUrl(repoUrl) {
  return prisma.submission.findFirst({
    where: {
      repoUrl: repoUrl, // Exact match
    },
    include: {
      user: {
        select: {
          id: true,
          githubId: true,
        },
      },
    },
  });
}

/**
 * Find submission by repository URL and user GitHub ID
 * More precise matching for PR mapping
 * @param {string} repoUrl - Repository URL
 * @param {string} githubId - User GitHub ID
 * @returns {Promise<Object|null>} Submission or null
 */
async function findByRepoUrlAndUser(repoUrl, githubId) {
  return prisma.submission.findFirst({
    where: {
      repoUrl: repoUrl,
      user: {
        githubId: githubId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          githubId: true,
        },
      },
    },
  });
}

/**
 * Attach PR number to submission
 * @param {string} submissionId - Submission ID
 * @param {number} prNumber - PR number
 * @returns {Promise<Object>} Updated submission
 */
async function attachPR(submissionId, prNumber) {
  return prisma.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      prNumber,
      status: 'SUBMITTED',
    },
  });
}

/**
 * Find submission by PR number
 * Used by workflow_run events to find submission
 * @param {number} prNumber - PR number
 * @returns {Promise<Object|null>} Submission or null
 */
async function findByPRNumber(prNumber) {
  return prisma.submission.findFirst({
    where: {
      prNumber: prNumber,
    },
    include: {
      user: {
        select: {
          id: true,
          githubId: true,
        },
      },
    },
  });
}

/**
 * Attach score to submission
 * @param {string} submissionId - Submission ID
 * @param {string} scoreId - Score ID
 * @returns {Promise<Object>} Updated submission
 */
async function attachScore(submissionId, scoreId) {
  return prisma.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      // Note: scoreId is linked via Score.submissionId relation
      // This method is for future use if needed
    },
  });
}

module.exports = {
  findByUserAndProject,
  create,
  update,
  findById,
  findByRepoUrl,
  findByRepoUrlAndUser,
  findByPRNumber,
  attachPR,
  attachScore,
};

