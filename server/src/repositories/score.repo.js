const prisma = require('../prisma/client');

/**
 * Create or update score record with all verification engine fields.
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
    // New fields (Phase 1-4) — optional
    verificationTier,
    dockerBuildSuccess,
    dockerBuildDurationMs,
    hiddenTestPassRate,
    hiddenTestTotal,
    hiddenTestPassed,
    coveragePercent,
    criticalVulns,
    highVulns,
    competencyLevel,
    competencyDomain,
    competencyBreakdown,
    reflectionScore,
    evidenceItems,
  } = scoreData;

  const data = {
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
  };

  // Only include new fields if explicitly provided
  if (verificationTier !== undefined) data.verificationTier = verificationTier;
  if (dockerBuildSuccess !== undefined) data.dockerBuildSuccess = dockerBuildSuccess;
  if (dockerBuildDurationMs !== undefined) data.dockerBuildDurationMs = dockerBuildDurationMs;
  if (hiddenTestPassRate !== undefined) data.hiddenTestPassRate = hiddenTestPassRate;
  if (hiddenTestTotal !== undefined) data.hiddenTestTotal = hiddenTestTotal;
  if (hiddenTestPassed !== undefined) data.hiddenTestPassed = hiddenTestPassed;
  if (coveragePercent !== undefined) data.coveragePercent = coveragePercent;
  if (criticalVulns !== undefined) data.criticalVulns = criticalVulns;
  if (highVulns !== undefined) data.highVulns = highVulns;
  if (competencyLevel !== undefined) data.competencyLevel = competencyLevel;
  if (competencyDomain !== undefined) data.competencyDomain = competencyDomain;
  if (competencyBreakdown !== undefined) data.competencyBreakdown = competencyBreakdown;
  if (reflectionScore !== undefined) data.reflectionScore = reflectionScore;
  if (evidenceItems !== undefined) data.evidenceItems = evidenceItems;

  return prisma.score.upsert({
    where: { submissionId },
    update: data,
    create: { submissionId, ...data },
  });
}

/**
 * Update specific fields on an existing Score record.
 */
async function update(scoreId, data) {
  return prisma.score.update({
    where: { id: scoreId },
    data,
  });
}

async function findBySubmissionId(submissionId) {
  return prisma.score.findUnique({ where: { submissionId } });
}

async function findById(scoreId) {
  return prisma.score.findUnique({ where: { id: scoreId } });
}

module.exports = {
  createOrUpdate,
  update,
  findBySubmissionId,
  findById,
};
