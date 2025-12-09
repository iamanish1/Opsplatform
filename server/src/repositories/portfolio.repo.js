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
  const portfolios = await prisma.portfolio.findMany({
    where: {
      userId,
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
      score: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Manually fetch submissions and projects for each portfolio
  // This is a workaround if Prisma client relation is not available
  const portfoliosWithSubmission = await Promise.all(
    portfolios.map(async (portfolio) => {
      try {
        const submission = await prisma.submission.findUnique({
          where: {
            id: portfolio.submissionId,
          },
          include: {
            project: true,
          },
        });

        return {
          ...portfolio,
          submission,
        };
      } catch (error) {
        // If submission fetch fails, return portfolio without submission
        console.warn(`Failed to fetch submission for portfolio ${portfolio.id}:`, error.message);
        return portfolio;
      }
    })
  );

  return portfoliosWithSubmission;
}

/**
 * Find portfolio by slug (for public URL)
 * @param {string} slug - Portfolio slug
 * @returns {Promise<Object|null>} Portfolio or null
 */
async function findBySlug(slug) {
  const portfolio = await prisma.portfolio.findUnique({
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
      score: true,
    },
  });

  if (!portfolio) {
    return null;
  }

  // Manually fetch submission and project
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: portfolio.submissionId,
      },
      include: {
        project: true,
      },
    });

    return {
      ...portfolio,
      submission,
    };
  } catch (error) {
    console.warn(`Failed to fetch submission for portfolio ${portfolio.id}:`, error.message);
    return portfolio;
  }
}

/**
 * Find portfolio by submission ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Portfolio or null
 */
async function findBySubmissionId(submissionId) {
  const portfolio = await prisma.portfolio.findUnique({
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
      score: true,
    },
  });

  if (!portfolio) {
    return null;
  }

  // Manually fetch submission and project
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: portfolio.submissionId,
      },
      include: {
        project: true,
      },
    });

    return {
      ...portfolio,
      submission,
    };
  } catch (error) {
    console.warn(`Failed to fetch submission for portfolio ${portfolio.id}:`, error.message);
    return portfolio;
  }
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

  const result = await prisma.portfolio.upsert({
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
      score: true,
    },
  });

  // Manually fetch submission and project
  if (result) {
    try {
      const submission = await prisma.submission.findUnique({
        where: {
          id: result.submissionId,
        },
        include: {
          project: true,
        },
      });

      return {
        ...result,
        submission,
      };
    } catch (error) {
      console.warn(`Failed to fetch submission for portfolio ${result.id}:`, error.message);
      return result;
    }
  }

  return result;
}

/**
 * Find portfolio by ID
 * @param {string} portfolioId - Portfolio ID
 * @returns {Promise<Object|null>} Portfolio or null
 */
async function findById(portfolioId) {
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          githubUsername: true,
          githubProfile: true,
        },
      },
      score: true,
    },
  });

  if (!portfolio) {
    return null;
  }

  // Manually fetch submission and project
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: portfolio.submissionId,
      },
      include: {
        project: true,
      },
    });

    return {
      ...portfolio,
      submission,
    };
  } catch (error) {
    console.warn(`Failed to fetch submission for portfolio ${portfolio.id}:`, error.message);
    return portfolio;
  }
}

module.exports = {
  create,
  findByUserId,
  findBySlug,
  findBySubmissionId,
  findById,
  update,
  upsertBySubmission,
};

