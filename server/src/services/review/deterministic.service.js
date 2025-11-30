/**
 * Deterministic Scoring Service
 * Computes objective 0-10 scores from static analysis signals
 * These scores are rule-based and don't depend on LLM
 */

/**
 * Compute code quality score from ESLint errors/warnings
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeCodeQualityDet(staticReport) {
  if (!staticReport) return 5; // Default if no data

  const errors = staticReport.eslintErrors || 0;
  const warnings = staticReport.eslintWarnings || 0;
  const totalIssues = errors + warnings;

  // Formula: 10 - (errors * 0.5) - (warnings * 0.1), clamped to 0-10
  let score = 10 - errors * 0.5 - warnings * 0.1;

  // Penalize heavily for many errors
  if (errors > 50) {
    score = Math.max(0, score - 3);
  } else if (errors > 20) {
    score = Math.max(0, score - 2);
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute bug risk score from CI failures and test results
 * @param {Object} ciReport - CI/CD report
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10 (higher = more risk, so we invert)
 */
function computeBugRiskDet(ciReport, staticReport) {
  let riskScore = 0; // Start with no risk

  // CI failures indicate high bug risk
  if (ciReport && ciReport.ciStatus === 'failure') {
    riskScore += 7; // High risk
  } else if (ciReport && ciReport.ciStatus === 'cancelled') {
    riskScore += 4; // Medium risk
  }

  // Test failures increase risk
  if (ciReport && ciReport.testResults) {
    const totalTests = ciReport.testResults.total || 0;
    const failedTests = ciReport.testResults.failed || 0;
    if (totalTests > 0) {
      const failureRate = failedTests / totalTests;
      riskScore += failureRate * 5; // Up to 5 points for test failures
    }
  }

  // ESLint errors indicate potential bugs
  const eslintErrors = staticReport?.eslintErrors || 0;
  if (eslintErrors > 0) {
    riskScore += Math.min(3, eslintErrors * 0.1); // Up to 3 points
  }

  // Return inverted score (10 = no risk, 0 = high risk)
  return Math.max(0, Math.min(10, Math.round((10 - riskScore) * 10) / 10));
}

/**
 * Compute DevOps execution score from Docker, YAML, and CI setup
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @returns {number} Score 0-10
 */
function computeDevopsExecutionDet(staticReport, ciReport) {
  let score = 10; // Start perfect

  // Docker issues
  const dockerIssues = staticReport?.dockerIssueCount || 0;
  if (dockerIssues >= 3) {
    score -= 4;
  } else if (dockerIssues > 0) {
    score -= dockerIssues * 1.5;
  }

  // YAML validation errors
  const yamlIssues = staticReport?.yamlIssueCount || 0;
  if (yamlIssues > 0) {
    score -= yamlIssues * 2; // YAML errors are critical
  }

  // CI/CD setup (bonus if CI exists and passes)
  if (ciReport) {
    if (ciReport.ciStatus === 'success') {
      score += 1; // Bonus for passing CI
    } else if (ciReport.ciStatus === 'no_workflows') {
      score -= 3; // Penalty for no CI
    }
  } else {
    score -= 2; // No CI data
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute security score from secret findings
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeSecurityDet(staticReport) {
  if (!staticReport) return 5;

  const securityAlerts = staticReport.securityAlertCount || 0;

  // Any secret found = 0
  if (securityAlerts > 0) {
    return 0;
  }

  // No secrets found = good security
  return 10;
}

/**
 * Compute delivery speed score from PR size and time metrics
 * @param {Object} prMetadata - PR metadata
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeDeliverySpeedDet(prMetadata, staticReport) {
  let score = 10; // Start perfect

  // Large PRs indicate slower delivery
  const prSize = staticReport?.prSize || prMetadata?.additions + prMetadata?.deletions || 0;
  if (prSize > 2000) {
    score -= 4; // Very large PR
  } else if (prSize > 1000) {
    score -= 2; // Large PR
  } else if (prSize > 500) {
    score -= 1; // Medium PR
  }

  // Too many files changed
  const fileCount = staticReport?.fileCount || prMetadata?.changedFiles || 0;
  if (fileCount > 20) {
    score -= 2;
  } else if (fileCount > 10) {
    score -= 1;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute documentation score from PR description and comments
 * @param {Object} prMetadata - PR metadata
 * @returns {number} Score 0-10
 */
function computeDocumentationDet(prMetadata) {
  if (!prMetadata) return 5;

  let score = 5; // Start neutral

  // PR description quality
  const description = prMetadata.description || '';
  if (!description || description.trim().length === 0) {
    score = 2; // No description = poor documentation
  } else if (description.length < 50) {
    score = 4; // Very short description
  } else if (description.length >= 200) {
    score = 8; // Good description
  } else {
    score = 6; // Decent description
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute git maturity score from PR size and file count
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeGitMaturityDet(staticReport) {
  if (!staticReport) return 5;

  let score = 10; // Start perfect

  const prSize = staticReport.prSize || 0;
  const fileCount = staticReport.fileCount || 0;

  // Large PRs indicate poor git practices
  if (prSize > 2000) {
    score -= 5;
  } else if (prSize > 1000) {
    score -= 3;
  } else if (prSize > 500) {
    score -= 1;
  }

  // Too many files changed
  if (fileCount > 20) {
    score -= 2;
  } else if (fileCount > 10) {
    score -= 1;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute optimization score from code patterns and resource usage
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeOptimizationDet(staticReport) {
  if (!staticReport) return 5;

  let score = 7; // Start decent (hard to measure from static analysis alone)

  // Docker optimization (image size, layers)
  const dockerIssues = staticReport.dockerIssues || [];
  const optimizationIssues = dockerIssues.filter(
    (issue) => issue.message && issue.message.toLowerCase().includes('optimize')
  ).length;

  if (optimizationIssues > 0) {
    score -= optimizationIssues * 1.5;
  }

  // Large PRs might indicate lack of optimization
  const prSize = staticReport.prSize || 0;
  if (prSize > 1500) {
    score -= 1;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute problem solving score from solution completeness
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @returns {number} Score 0-10
 */
function computeProblemSolvingDet(staticReport, ciReport) {
  let score = 7; // Start decent

  // CI passing indicates good problem solving
  if (ciReport && ciReport.ciStatus === 'success') {
    score += 2;
  } else if (ciReport && ciReport.ciStatus === 'failure') {
    score -= 2; // Failed CI suggests incomplete solution
  }

  // Fewer errors = better problem solving
  const eslintErrors = staticReport?.eslintErrors || 0;
  if (eslintErrors === 0) {
    score += 1;
  } else if (eslintErrors > 20) {
    score -= 1;
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute collaboration score from PR description quality and communication
 * @param {Object} prMetadata - PR metadata
 * @param {Object} staticReport - Static analysis report
 * @returns {number} Score 0-10
 */
function computeCollaborationDet(prMetadata, staticReport) {
  let score = 5; // Start neutral

  // PR description quality
  const description = prMetadata?.description || '';
  if (description && description.length >= 100) {
    score += 2; // Good description shows communication
  } else if (!description || description.length === 0) {
    score -= 2; // No description = poor collaboration
  }

  // Large PRs indicate poor collaboration (should be broken down)
  const prSize = staticReport?.prSize || 0;
  if (prSize > 2000) {
    score -= 3; // Very large PR
  } else if (prSize > 1000) {
    score -= 1; // Large PR
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Compute all deterministic scores
 * @param {Object} staticReport - Static analysis report
 * @param {Object} ciReport - CI/CD report
 * @param {Object} prMetadata - PR metadata
 * @returns {Object} All 10 deterministic scores
 */
function computeAllDeterministicScores(staticReport, ciReport, prMetadata) {
  return {
    codeQuality: computeCodeQualityDet(staticReport),
    problemSolving: computeProblemSolvingDet(staticReport, ciReport),
    bugRisk: computeBugRiskDet(ciReport, staticReport),
    devopsExecution: computeDevopsExecutionDet(staticReport, ciReport),
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

