/**
 * Talent Feed Service
 * Handles developer discovery and filtering for companies
 */

const prisma = require('../prisma/client');

/**
 * Get filtered talent feed
 * @param {Object} filters - Filter criteria
 * @param {string} filters.badge - Filter by badge (GREEN, YELLOW, RED)
 * @param {number} filters.minScore - Minimum total score
 * @param {number} filters.maxScore - Maximum total score
 * @param {Array<string>} filters.skills - Filter by skills/tags
 * @param {string} filters.country - Filter by location/country
 * @param {boolean} filters.hasProject - Filter users with at least one REVIEWED submission
 * @param {string} filters.githubUsername - Search by GitHub username (partial match)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Results per page (default: 20)
 * @returns {Promise<Object>} Paginated developer list
 */
async function getTalentFeed(filters = {}) {
  const {
    badge,
    minScore,
    maxScore,
    skills,
    country,
    hasProject,
    githubUsername,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    role: 'STUDENT', // Only show students/developers
  };

  // Filter by GitHub username (partial match)
  if (githubUsername) {
    // MySQL doesn't support case-insensitive mode, use contains which is case-sensitive
    // For case-insensitive, we'd need to use raw SQL or filter in JavaScript
    where.githubUsername = {
      contains: githubUsername,
    };
  }

  // Filter by location/country
  if (country) {
    where.location = {
      contains: country,
    };
  }

  // Filter by hasProject (users with at least one REVIEWED submission)
  if (hasProject === true) {
    where.submissions = {
      some: {
        status: 'REVIEWED',
      },
    };
  }

  // Build query with score and badge filtering
  // We need to join with Score table through submissions
  const users = await prisma.user.findMany({
    where,
    include: {
      submissions: {
        where: {
          status: 'REVIEWED',
        },
        include: {
          score: true,
          project: {
            select: {
              id: true,
              title: true,
              tags: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1, // Get latest reviewed submission
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Filter by badge and score range
  let filteredUsers = users;

  if (badge || minScore !== undefined || maxScore !== undefined) {
    filteredUsers = users.filter((user) => {
      const latestScore = user.submissions[0]?.score;
      if (!latestScore) {
        return false; // No score means no match
      }

      // Filter by badge
      if (badge && latestScore.badge !== badge) {
        return false;
      }

      // Filter by score range
      if (minScore !== undefined && latestScore.totalScore < minScore) {
        return false;
      }
      if (maxScore !== undefined && latestScore.totalScore > maxScore) {
        return false;
      }

      return true;
    });
  }

  // Filter by skills/tags
  if (skills && Array.isArray(skills) && skills.length > 0) {
    filteredUsers = filteredUsers.filter((user) => {
      const projectTags = user.submissions[0]?.project?.tags;
      if (!projectTags || !Array.isArray(projectTags)) {
        return false;
      }

      // Check if any of the requested skills match project tags
      return skills.some((skill) =>
        projectTags.some((tag) => tag.toLowerCase() === skill.toLowerCase())
      );
    });
  }

  // Format response
  const developers = filteredUsers.map((user) => {
    const latestSubmission = user.submissions[0];
    const latestScore = latestSubmission?.score;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      githubUsername: user.githubUsername,
      githubProfile: user.githubProfile,
      location: user.location,
      score: latestScore
        ? {
            totalScore: latestScore.totalScore,
            badge: latestScore.badge,
            codeQuality: latestScore.codeQuality,
            problemSolving: latestScore.problemSolving,
            bugRisk: latestScore.bugRisk,
            devopsExecution: latestScore.devopsExecution,
            optimization: latestScore.optimization,
            documentation: latestScore.documentation,
            gitMaturity: latestScore.gitMaturity,
            collaboration: latestScore.collaboration,
            deliverySpeed: latestScore.deliverySpeed,
            security: latestScore.security,
          }
        : null,
      latestProject: latestSubmission
        ? {
            id: latestSubmission.id,
            projectId: latestSubmission.projectId,
            projectTitle: latestSubmission.project?.title,
            repoUrl: latestSubmission.repoUrl,
            prNumber: latestSubmission.prNumber,
            status: latestSubmission.status,
            createdAt: latestSubmission.createdAt,
          }
        : null,
      hasPortfolio: Boolean(latestSubmission?.portfolio),
      portfolioSlug: latestSubmission?.portfolio?.slug || null,
    };
  });

  // Get total count (for pagination)
  const totalCount = await prisma.user.count({
    where,
  });

  return {
    developers,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

module.exports = {
  getTalentFeed,
};

