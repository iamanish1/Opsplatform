const prisma = require('../prisma/client');

/**
 * Create PR review record
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.submissionId - Submission ID
 * @param {number} reviewData.prNumber - PR number
 * @param {Object} reviewData.reviewJson - LLM review output (JSON)
 * @param {Object} reviewData.staticReport - Static analysis report (JSON)
 * @param {Array} reviewData.suggestions - Improvement suggestions
 * @returns {Promise<Object>} Created PR review
 */
async function create(reviewData) {
  const { submissionId, prNumber, reviewJson, staticReport, suggestions } = reviewData;

  return prisma.pRReview.create({
    data: {
      submissionId,
      prNumber,
      reviewJson: reviewJson || {},
      staticReport: staticReport || {},
      suggestions: suggestions || [],
    },
  });
}

/**
 * Find PR review by submission ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} PR review or null
 */
async function findBySubmissionId(submissionId) {
  return prisma.pRReview.findFirst({
    where: {
      submissionId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

module.exports = {
  create,
  findBySubmissionId,
};

