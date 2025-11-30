/**
 * Scoring Engine (Rubric) Service
 * Complete scoring engine that converts LLM + static analysis → trusted 100-point score
 */

const deterministicService = require('./deterministic.service');

/**
 * Weight configuration for fusion algorithm
 * LLM-heavy: More weight on AI judgment (subjective categories)
 * Static-heavy: More weight on deterministic scores (objective categories)
 * Balanced: Equal weight on both
 */
const FUSION_WEIGHTS = {
  // LLM-heavy (0.7 LLM, 0.3 det)
  problemSolving: { llm: 0.7, det: 0.3 },
  documentation: { llm: 0.7, det: 0.3 },
  collaboration: { llm: 0.7, det: 0.3 },
  optimization: { llm: 0.7, det: 0.3 },

  // Static-heavy (0.3 LLM, 0.7 det)
  bugRisk: { llm: 0.3, det: 0.7 },
  security: { llm: 0.3, det: 0.7 },
  devopsExecution: { llm: 0.3, det: 0.7 },

  // Balanced (0.6 LLM, 0.4 det)
  codeQuality: { llm: 0.6, det: 0.4 },
  gitMaturity: { llm: 0.6, det: 0.4 },
  deliverySpeed: { llm: 0.6, det: 0.4 },
};

/**
 * Apply sanity rules (mandatory rule-based adjustments)
 * These rules guarantee accuracy even if LLM fails
 * @param {Object} llmScores - LLM output scores (10 parameters)
 * @param {Object} staticReport - Static analysis results
 * @param {Object} ciReport - CI/CD results
 * @param {Object} prMetadata - PR metadata
 * @returns {Object} { adjustedScores, appliedRules }
 */
function applyFusionRules(llmScores, staticReport, ciReport, prMetadata) {
  // Clone scores to avoid mutation
  const adjusted = { ...llmScores };
  const appliedRules = [];

  // Rule 1: Secret Found → Security = 0
  if (staticReport && staticReport.securityAlertCount > 0) {
    adjusted.security = 0;
    appliedRules.push({
      rule: 'SECRET_FOUND',
      category: 'security',
      action: 'Set to 0',
      reason: `${staticReport.securityAlertCount} potential secret(s) found`,
    });
  }

  // Rule 2: CI Failure → bugRisk ≤ 3 & deliverySpeed ≤ 4
  if (ciReport && ciReport.ciStatus === 'failure') {
    if (adjusted.bugRisk > 3) {
      adjusted.bugRisk = 3;
      appliedRules.push({
        rule: 'CI_FAILURE',
        category: 'bugRisk',
        action: 'Capped at 3',
        reason: 'CI/CD pipeline failed',
      });
    }
    if (adjusted.deliverySpeed > 4) {
      adjusted.deliverySpeed = 4;
      appliedRules.push({
        rule: 'CI_FAILURE',
        category: 'deliverySpeed',
        action: 'Capped at 4',
        reason: 'CI/CD pipeline failed',
      });
    }
  }

  // Rule 3: ESLint > 50 → codeQuality ≤ 4
  if (staticReport && staticReport.eslintErrors > 50) {
    if (adjusted.codeQuality > 4) {
      adjusted.codeQuality = 4;
      appliedRules.push({
        rule: 'ESLINT_ERRORS_HIGH',
        category: 'codeQuality',
        action: 'Capped at 4',
        reason: `${staticReport.eslintErrors} ESLint errors found`,
      });
    }
  }

  // Rule 4: Docker Issues ≥ 3 → devopsExecution ≤ 4
  if (staticReport && staticReport.dockerIssueCount >= 3) {
    if (adjusted.devopsExecution > 4) {
      adjusted.devopsExecution = 4;
      appliedRules.push({
        rule: 'DOCKER_ISSUES_HIGH',
        category: 'devopsExecution',
        action: 'Capped at 4',
        reason: `${staticReport.dockerIssueCount} Docker issues found`,
      });
    }
  }

  // Rule 5: Large Diff (>2000 lines) → collaboration ≤ 4
  const prSize = staticReport?.prSize || 0;
  if (prSize > 2000) {
    if (adjusted.collaboration > 4) {
      adjusted.collaboration = 4;
      appliedRules.push({
        rule: 'LARGE_DIFF',
        category: 'collaboration',
        action: 'Capped at 4',
        reason: `PR size is ${prSize} lines (too large)`,
      });
    }
  }

  // Rule 6: No PR description → documentation ≤ 4
  const description = prMetadata?.description || '';
  if (!description || description.trim().length === 0) {
    if (adjusted.documentation > 4) {
      adjusted.documentation = 4;
      appliedRules.push({
        rule: 'NO_PR_DESCRIPTION',
        category: 'documentation',
        action: 'Capped at 4',
        reason: 'No PR description provided',
      });
    }
  }

  // Ensure all scores are between 0 and 10
  Object.keys(adjusted).forEach((key) => {
    if (typeof adjusted[key] === 'number') {
      adjusted[key] = Math.max(0, Math.min(10, adjusted[key]));
    }
  });

  return { adjustedScores: adjusted, appliedRules };
}

/**
 * Fuse LLM and deterministic scores using weighted combination
 * @param {Object} llmScores - LLM output scores (after sanity rules)
 * @param {Object} detScores - Deterministic scores
 * @returns {Object} Fused scores (all 10 categories)
 */
function fuseScores(llmScores, detScores) {
  const fused = {};

  // For each of 10 parameters, apply weighted fusion
  Object.keys(FUSION_WEIGHTS).forEach((category) => {
    const weights = FUSION_WEIGHTS[category];
    const llmScore = llmScores[category] || 0;
    const detScore = detScores[category] || 0;

    // Weighted combination: finalScore = (llmScore * llmWeight) + (detScore * detWeight)
    const fusedScore = llmScore * weights.llm + detScore * weights.det;
    fused[category] = Math.max(0, Math.min(10, Math.round(fusedScore * 10) / 10));
  });

  return fused;
}

/**
 * Calculate total score from all 10 category scores
 * @param {Object} scores - Score object with all 10 categories
 * @returns {number} Total score (0-100)
 */
function calculateTotalScore(scores) {
  const scoreFields = [
    'codeQuality',
    'problemSolving',
    'bugRisk',
    'devopsExecution',
    'optimization',
    'documentation',
    'gitMaturity',
    'collaboration',
    'deliverySpeed',
    'security',
  ];

  return scoreFields.reduce((sum, field) => sum + (scores[field] || 0), 0);
}

/**
 * Calculate badge from total score
 * @param {number} totalScore - Total score (0-100)
 * @returns {string} Badge ('GREEN', 'YELLOW', or 'RED')
 */
function calculateBadge(totalScore) {
  if (totalScore >= 75) {
    return 'GREEN';
  } else if (totalScore >= 50) {
    return 'YELLOW';
  } else {
    return 'RED';
  }
}

/**
 * Build evidence array for explainability
 * @param {Object} llmScores - LLM scores
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @param {Array} appliedRules - Applied sanity rules
 * @param {Object} detScores - Deterministic scores
 * @param {Object} prMetadata - PR metadata
 * @returns {Array} Array of evidence strings
 */
function buildEvidenceArray(llmScores, staticReport, ciReport, appliedRules, detScores, prMetadata) {
  const evidence = [];

  // CI/CD evidence
  if (ciReport) {
    if (ciReport.ciStatus === 'success') {
      evidence.push(`CI/CD: All workflows passed (${ciReport.workflowCount} workflow(s))`);
    } else if (ciReport.ciStatus === 'failure') {
      evidence.push(`CI/CD: Workflow failed - ${ciReport.failures?.join(', ') || 'Unknown error'}`);
    } else if (ciReport.ciStatus === 'no_workflows') {
      evidence.push('CI/CD: No workflows found');
    } else {
      evidence.push(`CI/CD: Status = ${ciReport.ciStatus}`);
    }

    if (ciReport.testResults) {
      evidence.push(
        `Tests: ${ciReport.testResults.passed} passed, ${ciReport.testResults.failed} failed out of ${ciReport.testResults.total} total`
      );
    }
  }

  // ESLint evidence
  if (staticReport) {
    const eslintErrors = staticReport.eslintErrors || 0;
    const eslintWarnings = staticReport.eslintWarnings || 0;
    if (eslintErrors > 0 || eslintWarnings > 0) {
      evidence.push(`ESLint: ${eslintErrors} errors, ${eslintWarnings} warnings`);
    } else {
      evidence.push('ESLint: No issues found');
    }

    // Docker evidence
    if (staticReport.dockerIssueCount > 0) {
      evidence.push(`Docker: ${staticReport.dockerIssueCount} issue(s) found`);
    }

    // YAML evidence
    if (staticReport.yamlIssueCount > 0) {
      evidence.push(`YAML: ${staticReport.yamlIssueCount} validation error(s)`);
    }

    // Security evidence
    if (staticReport.securityAlertCount > 0) {
      evidence.push(`Security: ${staticReport.securityAlertCount} potential secret(s) found`);
    } else {
      evidence.push('Security: No secrets detected');
    }

    // PR size evidence
    const prSize = staticReport.prSize || 0;
    if (prSize > 2000) {
      evidence.push(`PR size: ${prSize} lines (very large - consider breaking down)`);
    } else if (prSize > 1000) {
      evidence.push(`PR size: ${prSize} lines (large)`);
    } else if (prSize > 0) {
      evidence.push(`PR size: ${prSize} lines (acceptable)`);
    }

    // File count evidence
    const fileCount = staticReport.fileCount || 0;
    if (fileCount > 0) {
      evidence.push(`Files changed: ${fileCount}`);
    }
  }

  // PR description evidence
  if (prMetadata) {
    const description = prMetadata.description || '';
    if (!description || description.trim().length === 0) {
      evidence.push('PR description: Not provided');
    } else if (description.length < 50) {
      evidence.push('PR description: Very short');
    } else {
      evidence.push('PR description: Provided');
    }
  }

  // Applied rules evidence
  if (appliedRules && appliedRules.length > 0) {
    appliedRules.forEach((rule) => {
      evidence.push(`Rule applied: ${rule.rule} → ${rule.category} ${rule.action} (${rule.reason})`);
    });
  }

  return evidence;
}

/**
 * Generate complete score with all 10 categories, badge, and evidence
 * @param {Object} llmScores - LLM output scores
 * @param {Object} staticReport - Static analysis results
 * @param {Object} ciReport - CI/CD results
 * @param {Object} prMetadata - PR metadata
 * @returns {Object} Complete score object with all fields
 */
function generateScore(llmScores, staticReport, ciReport, prMetadata) {
  // Step 1: Compute deterministic sub-scores
  const detScores = deterministicService.computeAllDeterministicScores(staticReport, ciReport, prMetadata);

  // Step 2: Apply sanity rules to LLM scores
  const { adjustedScores, appliedRules } = applyFusionRules(llmScores, staticReport, ciReport, prMetadata);

  // Step 3: Fuse LLM + deterministic scores using weights
  const fusedScores = fuseScores(adjustedScores, detScores);

  // Step 4: Calculate total score (sum of all 10 categories)
  const totalScore = calculateTotalScore(fusedScores);

  // Step 5: Calculate badge
  const badge = calculateBadge(totalScore);

  // Step 6: Build evidence array
  const evidence = buildEvidenceArray(
    adjustedScores,
    staticReport,
    ciReport,
    appliedRules,
    detScores,
    prMetadata
  );

  // Step 7: Build detailsJson object
  const detailsJson = {
    breakdown: {
      codeQuality: fusedScores.codeQuality,
      problemSolving: fusedScores.problemSolving,
      bugRisk: fusedScores.bugRisk,
      devopsExecution: fusedScores.devopsExecution,
      optimization: fusedScores.optimization,
      documentation: fusedScores.documentation,
      gitMaturity: fusedScores.gitMaturity,
      collaboration: fusedScores.collaboration,
      deliverySpeed: fusedScores.deliverySpeed,
      security: fusedScores.security,
    },
    summary: llmScores.summary || 'No summary available',
    suggestions: llmScores.suggestions || [],
    evidence: evidence,
    raw: {
      llmOutput: llmScores,
      staticReport: staticReport || {},
      detScores: detScores,
      rulesApplied: appliedRules,
    },
  };

  // Step 8: Return complete score object
  return {
    // All 10 category scores
    codeQuality: fusedScores.codeQuality,
    problemSolving: fusedScores.problemSolving,
    bugRisk: fusedScores.bugRisk,
    devopsExecution: fusedScores.devopsExecution,
    optimization: fusedScores.optimization,
    documentation: fusedScores.documentation,
    gitMaturity: fusedScores.gitMaturity,
    collaboration: fusedScores.collaboration,
    deliverySpeed: fusedScores.deliverySpeed,
    security: fusedScores.security,

    // Legacy reliability field (inverse of bugRisk)
    reliability: Math.round((10 - fusedScores.bugRisk) * 10) / 10,

    // Final score and badge
    totalScore: totalScore,
    badge: badge,

    // Detailed breakdown
    detailsJson: detailsJson,
  };
}

module.exports = {
  applyFusionRules,
  fuseScores,
  calculateTotalScore,
  calculateBadge,
  buildEvidenceArray,
  generateScore,
};
