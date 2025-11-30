const prisma = require('../prisma/client');

/**
 * Create or update score record
 * @param {Object} scoreData - Score data
 * @param {string} scoreData.submissionId - Submission ID
 * @param {number} scoreData.codeQuality - Code quality score (0-10)
 * @param {number} scoreData.problemSolving - Problem solving score (0-10)
 * @param {number} scoreData.bugRisk - Bug risk score (0-10)
 * @param {number} scoreData.devopsExecution - DevOps execution score (0-10)
 * @param {number} scoreData.optimization - Optimization score (0-10)
 * @param {number} scoreData.documentation - Documentation score (0-10)
 * @param {number} scoreData.gitMaturity - Git maturity score (0-10)
 * @param {number} scoreData.collaboration - Collaboration score (0-10)
 * @param {number} scoreData.deliverySpeed - Delivery speed score (0-10)
 * @param {number} scoreData.security - Security score (0-10)
 * @param {number} scoreData.reliability - Reliability score (0-10) - legacy field
 * @param {number} scoreData.totalScore - Total score (0-100)
 * @param {string} scoreData.badge - Badge ('GREEN', 'YELLOW', or 'RED')
 * @param {Object} scoreData.detailsJson - Detailed breakdown and evidence
 * @returns {Promise<Object>} Created or updated score
 */
async function createOrUpdate(scoreData) {
  const {
    submissionId,
    codeQuality,
    problemSolving,
    bugRisk,
    devopsExecution,
    optimization,
    documentation,
    gitMaturity,
    collaboration,
    deliverySpeed,
    security,
    reliability,
    totalScore,
    badge,
    detailsJson,
  } = scoreData;

  return prisma.score.upsert({
    where: {
      submissionId,
    },
    update: {
      codeQuality,
      problemSolving,
      bugRisk,
      devopsExecution,
      optimization,
      documentation,
      gitMaturity,
      collaboration,
      deliverySpeed,
      security,
      reliability,
      totalScore,
      badge,
      detailsJson,
    },
    create: {
      submissionId,
      codeQuality,
      problemSolving,
      bugRisk,
      devopsExecution,
      optimization,
      documentation,
      gitMaturity,
      collaboration,
      deliverySpeed,
      security,
      reliability,
      totalScore,
      badge,
      detailsJson,
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

/**
 * Find score by ID
 * @param {string} scoreId - Score ID
 * @returns {Promise<Object|null>} Score or null
 */
async function findById(scoreId) {
  return prisma.score.findUnique({
    where: {
      id: scoreId,
    },
  });
}

module.exports = {
  createOrUpdate,
  findBySubmissionId,
  findById,
};

