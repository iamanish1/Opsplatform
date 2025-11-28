const prisma = require('../prisma/client');

/**
 * Create or update score record
 * @param {Object} scoreData - Score data
 * @param {string} scoreData.submissionId - Submission ID
 * @param {number} scoreData.codeQuality - Code quality score (0-10)
 * @param {number} scoreData.devopsExecution - DevOps execution score (0-10)
 * @param {number} scoreData.reliability - Reliability score (0-10)
 * @param {number} scoreData.deliverySpeed - Delivery speed score (0-10)
 * @param {number} scoreData.collaboration - Collaboration score (0-10)
 * @param {number} scoreData.totalScore - Total score
 * @returns {Promise<Object>} Created or updated score
 */
async function createOrUpdate(scoreData) {
  const { submissionId, codeQuality, devopsExecution, reliability, deliverySpeed, collaboration, totalScore } = scoreData;

  return prisma.score.upsert({
    where: {
      submissionId,
    },
    update: {
      codeQuality,
      devopsExecution,
      reliability,
      deliverySpeed,
      collaboration,
      totalScore,
    },
    create: {
      submissionId,
      codeQuality,
      devopsExecution,
      reliability,
      deliverySpeed,
      collaboration,
      totalScore,
    },
  });
}

/**
 * Find score by submission ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Score or null
 */
async function findBySubmissionId(submissionId) {
  return prisma.score.findUnique({
    where: {
      submissionId,
    },
  });
}

module.exports = {
  createOrUpdate,
  findBySubmissionId,
};

