/**
 * Scoring Service for Review Worker
 * Applies fusion rules and maps LLM scores to schema format
 */

/**
 * Apply fusion rules (rule-based adjustments to LLM scores)
 * @param {Object} llmScores - LLM output scores (10 parameters)
 * @param {Object} staticReport - Static analysis results
 * @param {Object} ciReport - CI/CD results
 * @returns {Object} Adjusted scores
 */
function applyFusionRules(llmScores, staticReport, ciReport) {
  // Clone scores to avoid mutation
  const adjusted = { ...llmScores };

  // Rule 1: If CI failed → bugRisk and reliability penalties
  if (ciReport && ciReport.ciStatus === 'failure') {
    adjusted.bugRisk = Math.min(adjusted.bugRisk, 3);
    // Note: reliability is calculated later, but we'll adjust problemSolving as proxy
    adjusted.problemSolving = Math.min(adjusted.problemSolving, 5);
  }

  // Rule 2: If secrets found → security = 0
  if (staticReport && staticReport.securityAlertCount > 0) {
    adjusted.security = 0;
  }

  // Rule 3: If ESLint errors > 50 → codeQuality penalty
  if (staticReport && staticReport.eslintErrors > 50) {
    adjusted.codeQuality = Math.min(adjusted.codeQuality, 5);
  }

  // Rule 4: If Dockerfile unsafe → devopsExecution penalty
  if (staticReport && staticReport.dockerIssueCount > 0) {
    const criticalDockerIssues = staticReport.dockerIssues.filter((issue) => issue.severity === 'error').length;
    if (criticalDockerIssues > 0) {
      adjusted.devopsExecution = Math.min(adjusted.devopsExecution, 5);
    }
  }

  // Rule 5: If PR too large (>1000 lines) → deliverySpeed penalty
  if (staticReport && staticReport.prSize > 1000) {
    adjusted.deliverySpeed = Math.max(0, adjusted.deliverySpeed - 2);
  }

  // Rule 6: If messy commits (low git score) → gitMaturity penalty
  if (staticReport && staticReport.gitScore < 5) {
    adjusted.gitMaturity = Math.min(adjusted.gitMaturity, staticReport.gitScore);
  }

  // Rule 7: If YAML validation errors → devopsExecution penalty
  if (staticReport && staticReport.yamlIssueCount > 0) {
    adjusted.devopsExecution = Math.min(adjusted.devopsExecution, 6);
  }

  // Ensure all scores are between 0 and 10
  Object.keys(adjusted).forEach((key) => {
    if (typeof adjusted[key] === 'number') {
      adjusted[key] = Math.max(0, Math.min(10, adjusted[key]));
    }
  });

  return adjusted;
}

/**
 * Calculate total score from all parameters
 * @param {Object} scores - Score object
 * @returns {number} Total score
 */
function calculateTotalScore(scores) {
  const scoreFields = [
    'codeQuality',
    'devopsExecution',
    'reliability',
    'deliverySpeed',
    'collaboration',
  ];

  return scoreFields.reduce((sum, field) => sum + (scores[field] || 0), 0);
}

/**
 * Map 10 LLM scores to 5 schema fields
 * @param {Object} llmScores - LLM output (10 parameters)
 * @returns {Object} Schema-compatible scores (5 fields)
 */
function mapToSchemaScores(llmScores) {
  // Direct mappings
  const codeQuality = llmScores.codeQuality || 0;
  const devopsExecution = llmScores.devopsExecution || 0;
  const deliverySpeed = llmScores.deliverySpeed || 0;

  // Composite mappings
  // reliability = inverse of bugRisk (higher bugRisk = lower reliability)
  // We convert: bugRisk 0-10 → reliability 10-0
  const bugRisk = llmScores.bugRisk || 5;
  const reliability = 10 - bugRisk; // Inverse mapping

  // collaboration = average of collaboration and gitMaturity
  const collaborationScore = llmScores.collaboration || 0;
  const gitMaturityScore = llmScores.gitMaturity || 0;
  const collaboration = Math.round((collaborationScore + gitMaturityScore) / 2);

  return {
    codeQuality,
    devopsExecution,
    reliability,
    deliverySpeed,
    collaboration,
  };
}

/**
 * Generate final score with fusion rules applied
 * @param {Object} llmScores - LLM output scores
 * @param {Object} staticReport - Static analysis results
 * @param {Object} ciReport - CI/CD results
 * @returns {Object} Final scores ready for database
 */
function generateScore(llmScores, staticReport, ciReport) {
  // Apply fusion rules
  const adjustedScores = applyFusionRules(llmScores, staticReport, ciReport);

  // Map to schema format (10 → 5 fields)
  const schemaScores = mapToSchemaScores(adjustedScores);

  // Calculate total score
  const totalScore = calculateTotalScore(schemaScores);

  return {
    ...schemaScores,
    totalScore,
    // Keep original LLM scores for reference
    llmScores: adjustedScores,
  };
}

module.exports = {
  applyFusionRules,
  calculateTotalScore,
  mapToSchemaScores,
  generateScore,
};

