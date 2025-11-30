const prisma = require('../prisma/client');

/**
 * Create new portfolio
 * @param {Object} portfolioData - Portfolio data
 * @param {string} portfolioData.userId - User ID
 * @param {string} portfolioData.submissionId - Submission ID
 * @param {string} portfolioData.slug - Unique slug
 * @param {string} portfolioData.scoreId - Score ID (optional)
 * @param {string} portfolioData.summary - User summary (optional)
 * @param {Object} portfolioData.portfolioJson - Complete portfolio JSON
 * @returns {Promise<Object>} Created portfolio
 */
async function create(portfolioData) {
  const { userId, submissionId, slug, scoreId, summary, portfolioJson } = portfolioData;

  return prisma.portfolio.create({
    data: {
      userId,
      submissionId,
      slug,
      scoreId,
      summary,
      portfolioJson: portfolioJson || {},
    },
  });
}

/**
 * Find all portfolios for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of portfolios
 */
async function findByUserId(userId) {
  return prisma.portfolio.findMany({
    where: {
      userId,
    },
    include: {
      submission: {
        include: {
          project: true,
        },
      },
      score: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Find portfolio by slug (for public URL)
 * @param {string} slug - Portfolio slug
 * @returns {Promise<Object|null>} Portfolio or null
 */
async function findBySlug(slug) {
  return prisma.portfolio.findUnique({
    where: {
      slug,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          githubUsername: true,
          githubProfile: true,
        },
      },
      submission: {
        include: {
          project: true,
        },
      },
      score: true,
    },
  });
}

/**
 * Find portfolio by submission ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Portfolio or null
 */
async function findBySubmissionId(submissionId) {
  return prisma.portfolio.findUnique({
    where: {
      submissionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          githubUsername: true,
          githubProfile: true,
        },
      },
      submission: {
        include: {
          project: true,
        },
      },
      score: true,
    },
  });
}

/**
 * Update existing portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {Object} portfolioData - Fields to update
 * @returns {Promise<Object>} Updated portfolio
 */
async function update(portfolioId, portfolioData) {
  return prisma.portfolio.update({
    where: {
      id: portfolioId,
    },
    data: portfolioData,
  });
}

/**
 * Create or update portfolio for a submission (upsert)
 * @param {string} submissionId - Submission ID
 * @param {Object} portfolioData - Portfolio data
 * @returns {Promise<Object>} Created or updated portfolio
 */
async function upsertBySubmission(submissionId, portfolioData) {
  const { userId, slug, scoreId, summary, portfolioJson } = portfolioData;

  return prisma.portfolio.upsert({
    where: {
      submissionId,
    },
    update: {
      slug,
      scoreId,
      summary,
      portfolioJson: portfolioJson || {},
      updatedAt: new Date(),
    },
    create: {
      userId,
      submissionId,
      slug,
      scoreId,
      summary,
      portfolioJson: portfolioJson || {},
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          githubUsername: true,
          githubProfile: true,
        },
      },
      submission: {
        include: {
          project: true,
        },
      },
      score: true,
    },
  });
}

module.exports = {
  create,
  findByUserId,
  findBySlug,
  findBySubmissionId,
  update,
  upsertBySubmission,
};

