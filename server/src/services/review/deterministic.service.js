/**
 * Deterministic Scoring Service
 * Computes objective 0-10 scores from static analysis signals.
 * Now accepts optional executionResult from Docker eval (Phase 1+).
 * These scores are rule-based and don't depend on LLM.
 */

/**
 * Compute code quality score from ESLint errors/warnings and complexity.
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeCodeQualityDet(staticReport) {
  if (!staticReport) return 5;

  const errors = staticReport.eslintErrors || 0;
  const warnings = staticReport.eslintWarnings || 0;

  let score = 10 - errors * 0.5 - warnings * 0.1;

  if (errors > 50) {
    score = Math.max(0, score - 3);
  } else if (errors > 20) {
    score = Math.max(0, score - 2);
  }

  // Penalize high cyclomatic complexity (new)
  const avgComplexity = staticReport.averageComplexity;
  if (avgComplexity !== null && avgComplexity !== undefined) {
    if (avgComplexity > 15) score -= 2;
    else if (avgComplexity > 10) score -= 1;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute bug risk score from CI, hidden test pass rate, coverage, and ESLint.
 * @param {Object} ciReport - CI/CD report
 * @param {Object} staticReport - Static analysis report
 * @param {Object} [executionResult] - Docker eval result { hiddenTestPassRate, coveragePercent }
 * @returns {number} Score 0-10 (10 = no risk)
 */
function computeBugRiskDet(ciReport, staticReport, executionResult) {
  let riskScore = 0;

  // CI failures
  if (ciReport && ciReport.ciStatus === 'failure') {
    riskScore += 5;
  } else if (ciReport && ciReport.ciStatus === 'cancelled') {
    riskScore += 3;
  }

  // Hidden test pass rate is the strongest bug-risk signal (up to 4 pts)
  const passRate = executionResult?.hiddenTestPassRate;
  if (passRate !== null && passRate !== undefined) {
    riskScore += (1 - passRate) * 4;
  } else if (ciReport && ciReport.testResults) {
    const total = ciReport.testResults.total || 0;
    const failed = ciReport.testResults.failed || 0;
    if (total > 0) riskScore += (failed / total) * 4;
  }

  // Coverage: low coverage = higher bug risk (up to 2 pts)
  const coverage = executionResult?.coveragePercent ?? staticReport?.coveragePercent;
  if (coverage !== null && coverage !== undefined) {
    if (coverage < 30) riskScore += 2;
    else if (coverage < 60) riskScore += 1;
  }

  // ESLint errors (up to 2 pts)
  const eslintErrors = staticReport?.eslintErrors || 0;
  riskScore += Math.min(2, eslintErrors * 0.05);

  return Math.max(0, Math.min(10, Math.round((10 - riskScore) * 10) / 10));
}

/**
 * Compute DevOps execution score from Docker build, YAML, and CI setup.
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @param {Object} [executionResult] - Docker eval result { dockerBuildSuccess }
 * @returns {number} Score 0-10
 */
function computeDevopsExecutionDet(staticReport, ciReport, executionResult) {
  let score = 10;

  // Docker build result from eval (strongest signal)
  if (executionResult && executionResult.dockerBuildSuccess !== null) {
    if (executionResult.dockerBuildSuccess === false && !executionResult.noDockerfile) {
      score -= 5; // Docker build failure is a hard penalty
    } else if (executionResult.noDockerfile) {
      score -= 3; // No Dockerfile
    }
  } else {
    // Fall back to static Dockerfile analysis
    const dockerIssues = staticReport?.dockerIssueCount || 0;
    if (dockerIssues >= 3) score -= 4;
    else if (dockerIssues > 0) score -= dockerIssues * 1.5;
  }

  // YAML validation errors
  const yamlIssues = staticReport?.yamlIssueCount || 0;
  if (yamlIssues > 0) score -= yamlIssues * 2;

  // CI/CD status
  if (ciReport) {
    if (ciReport.ciStatus === 'success') score += 1;
    else if (ciReport.ciStatus === 'no_workflows') score -= 3;
  } else {
    score -= 2;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute security score from secret findings and dependency vulnerabilities.
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeSecurityDet(staticReport) {
  if (!staticReport) return 5;

  // Any secret found → 0 (hard floor)
  if ((staticReport.securityAlertCount || 0) > 0) {
    return 0;
  }

  let score = 10;

  // Critical vulns → 0
  if ((staticReport.criticalVulns || 0) > 0) return 0;

  // High vulns → significant penalty
  const highVulns = staticReport.highVulns || 0;
  if (highVulns > 0) score -= Math.min(4, highVulns * 2);

  // Medium vulns → minor penalty
  const mediumVulns = staticReport.mediumVulns || 0;
  if (mediumVulns > 0) score -= Math.min(2, mediumVulns);

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute delivery speed score from PR size and time metrics.
 * @param {Object} prMetadata - PR metadata
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeDeliverySpeedDet(prMetadata, staticReport) {
  let score = 10;

  const prSize = staticReport?.prSize || (prMetadata?.additions + prMetadata?.deletions) || 0;
  if (prSize > 2000) score -= 4;
  else if (prSize > 1000) score -= 2;
  else if (prSize > 500) score -= 1;

  const fileCount = staticReport?.fileCount || prMetadata?.changedFiles || 0;
  if (fileCount > 20) score -= 2;
  else if (fileCount > 10) score -= 1;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute documentation score from PR description.
 * @param {Object} prMetadata - PR metadata
 * @returns {number} Score 0-10
 */
function computeDocumentationDet(prMetadata) {
  if (!prMetadata) return 5;

  const description = prMetadata.description || '';
  if (!description || description.trim().length === 0) return 2;
  if (description.length < 50) return 4;
  if (description.length >= 200) return 8;
  return 6;
}

/**
 * Compute git maturity score from PR size and file count.
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeGitMaturityDet(staticReport) {
  if (!staticReport) return 5;

  let score = 10;
  const prSize = staticReport.prSize || 0;
  const fileCount = staticReport.fileCount || 0;

  if (prSize > 2000) score -= 5;
  else if (prSize > 1000) score -= 3;
  else if (prSize > 500) score -= 1;

  if (fileCount > 20) score -= 2;
  else if (fileCount > 10) score -= 1;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute optimization score from code complexity and Docker optimization.
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeOptimizationDet(staticReport) {
  if (!staticReport) return 5;

  let score = 7;

  // Docker optimization issues
  const dockerIssues = staticReport.dockerIssues || [];
  const optimizationIssues = dockerIssues.filter(
    (i) => i.message && i.message.toLowerCase().includes('optimize')
  ).length;
  if (optimizationIssues > 0) score -= optimizationIssues * 1.5;

  // High complexity = worse optimization
  const avgComplexity = staticReport.averageComplexity;
  if (avgComplexity !== null && avgComplexity !== undefined) {
    if (avgComplexity > 15) score -= 2;
    else if (avgComplexity > 10) score -= 1;
  }

  if ((staticReport.prSize || 0) > 1500) score -= 1;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute problem solving score from hidden test results, CI, and ESLint.
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @param {Object} [executionResult] - Docker eval result { hiddenTestPassRate }
 * @returns {number} Score 0-10
 */
function computeProblemSolvingDet(staticReport, ciReport, executionResult) {
  let score = 7;

  // Hidden test pass rate is the best problem-solving signal
  const passRate = executionResult?.hiddenTestPassRate;
  if (passRate !== null && passRate !== undefined) {
    // 0% pass rate = -4, 100% pass rate = +3
    score = 5 + passRate * 5;
  } else {
    // Fallback: CI status
    if (ciReport && ciReport.ciStatus === 'success') score += 2;
    else if (ciReport && ciReport.ciStatus === 'failure') score -= 2;

    const eslintErrors = staticReport?.eslintErrors || 0;
    if (eslintErrors === 0) score += 1;
    else if (eslintErrors > 20) score -= 1;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute collaboration score from PR description quality and PR size.
 * @param {Object} prMetadata - PR metadata
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeCollaborationDet(prMetadata, staticReport) {
  let score = 5;

  const description = prMetadata?.description || '';
  if (description && description.length >= 100) score += 2;
  else if (!description || description.length === 0) score -= 2;

  const prSize = staticReport?.prSize || 0;
  if (prSize > 2000) score -= 3;
  else if (prSize > 1000) score -= 1;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute all deterministic scores.
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @param {Object} prMetadata - PR metadata
 * @param {Object} [executionResult] - Docker eval result (optional)
 * @returns {Object} All 10 deterministic scores
 */
function computeAllDeterministicScores(staticReport, ciReport, prMetadata, executionResult) {
  return {
    codeQuality: computeCodeQualityDet(staticReport),
    problemSolving: computeProblemSolvingDet(staticReport, ciReport, executionResult),
    bugRisk: computeBugRiskDet(ciReport, staticReport, executionResult),
    devopsExecution: computeDevopsExecutionDet(staticReport, ciReport, executionResult),
    optimization: computeOptimizationDet(staticReport),
    documentation: computeDocumentationDet(prMetadata),
    gitMaturity: computeGitMaturityDet(staticReport),
    collaboration: computeCollaborationDet(prMetadata, staticReport),
    deliverySpeed: computeDeliverySpeedDet(prMetadata, staticReport),
    security: computeSecurityDet(staticReport),
  };
}

module.exports = {
  computeCodeQualityDet,
  computeBugRiskDet,
  computeDevopsExecutionDet,
  computeSecurityDet,
  computeDeliverySpeedDet,
  computeDocumentationDet,
  computeGitMaturityDet,
  computeOptimizationDet,
  computeProblemSolvingDet,
  computeCollaborationDet,
  computeAllDeterministicScores,
};
