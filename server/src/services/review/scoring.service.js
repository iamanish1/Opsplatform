/**
 * Scoring Engine — converts LLM narrative + static analysis + execution evidence
 * into a trusted 100-point verification score with badge and tier.
 *
 * Scoring layers (applied in order):
 *   1. Deterministic scores   — purely rule-based, from static + execution signals
 *   2. LLM sanity rules       — cap/zero LLM scores on hard evidence failures
 *   3. Fusion weights         — weighted blend of LLM + deterministic per category
 *   4. Evidence gate rules    — non-negotiable gates that cap badge tier
 *   5. Verification tier      — VERIFIED / PARTIAL / NOT_VERIFIED
 */

const deterministicService = require('./deterministic.service');

// ─── Fusion weights ────────────────────────────────────────────────────────
// When execution evidence (hidden tests, Docker) is available, deterministic
// weight increases because evidence > opinion.
const FUSION_WEIGHTS = {
  problemSolving:  { llm: 0.7, det: 0.3 },
  documentation:   { llm: 0.7, det: 0.3 },
  collaboration:   { llm: 0.7, det: 0.3 },
  optimization:    { llm: 0.7, det: 0.3 },
  bugRisk:         { llm: 0.3, det: 0.7 },
  security:        { llm: 0.3, det: 0.7 },
  devopsExecution: { llm: 0.3, det: 0.7 },
  codeQuality:     { llm: 0.6, det: 0.4 },
  gitMaturity:     { llm: 0.6, det: 0.4 },
  deliverySpeed:   { llm: 0.6, det: 0.4 },
};

// When execution evidence is available, shift weights further toward deterministic
const EXECUTION_EVIDENCE_BOOST = {
  problemSolving:  { llm: 0.3, det: 0.7 },
  bugRisk:         { llm: 0.1, det: 0.9 },
  devopsExecution: { llm: 0.1, det: 0.9 },
  security:        { llm: 0.2, det: 0.8 },
};

// ─── Badge thresholds ──────────────────────────────────────────────────────
const BADGE_THRESHOLDS = {
  GREEN:  75,
  YELLOW: 50,
};

// ─── Verification tier gate rules ─────────────────────────────────────────
// ALL gates in a tier must pass to achieve that tier.
// Failing gates demote to the next tier down.
const VERIFICATION_GATES = {
  VERIFIED: [
    {
      id: 'no_secrets',
      label: 'No secrets detected',
      check: (ctx) => (ctx.staticReport?.securityAlertCount || 0) === 0,
    },
    {
      id: 'no_critical_vulns',
      label: 'No critical dependency vulnerabilities',
      check: (ctx) => (ctx.staticReport?.criticalVulns || 0) === 0,
    },
    {
      id: 'docker_build',
      label: 'Docker build succeeded',
      check: (ctx) =>
        ctx.executionResult === null || // No eval run — don't penalize
        ctx.executionResult?.dockerBuildSuccess === true ||
        ctx.executionResult?.noDockerfile === true, // No Dockerfile is allowed for non-DevOps projects
    },
    {
      id: 'hidden_tests',
      label: 'Hidden test pass rate ≥ 60%',
      check: (ctx) =>
        ctx.executionResult?.hiddenTestPassRate === null ||     // No hidden tests
        ctx.executionResult?.hiddenTestPassRate === undefined ||
        ctx.executionResult?.hiddenTestPassRate >= 0.6,
    },
    {
      id: 'reflection_answered',
      label: 'Reflection questions answered',
      check: (ctx) => !ctx.reflectionRequired || ctx.reflectionAnswered === true,
    },
    {
      id: 'reflection_consistent',
      label: 'No reflection inconsistencies detected',
      check: (ctx) => !(ctx.reflectionConsistencyFlag === true),
    },
  ],
  PARTIAL: [
    {
      id: 'no_secrets',
      label: 'No secrets detected',
      check: (ctx) => (ctx.staticReport?.securityAlertCount || 0) === 0,
    },
    {
      id: 'no_critical_vulns',
      label: 'No critical dependency vulnerabilities',
      check: (ctx) => (ctx.staticReport?.criticalVulns || 0) === 0,
    },
  ],
};

/**
 * Apply sanity rules — hard adjustments to LLM scores based on objective evidence.
 * These rules guarantee accuracy even if the LLM over-rates bad code.
 */
function applyFusionRules(llmScores, staticReport, ciReport, prMetadata) {
  const adjusted = { ...llmScores };
  const appliedRules = [];

  // Secret found → security = 0
  if ((staticReport?.securityAlertCount || 0) > 0) {
    adjusted.security = 0;
    appliedRules.push({ rule: 'SECRET_FOUND', category: 'security', action: 'Set to 0', reason: `${staticReport.securityAlertCount} secret(s) found` });
  }

  // Critical vuln → security cap at 2
  if ((staticReport?.criticalVulns || 0) > 0) {
    if (adjusted.security > 2) adjusted.security = 2;
    appliedRules.push({ rule: 'CRITICAL_VULN', category: 'security', action: 'Capped at 2', reason: `${staticReport.criticalVulns} critical vulnerability` });
  }

  // CI failure → bugRisk ≤ 3, deliverySpeed ≤ 4
  if (ciReport?.ciStatus === 'failure') {
    if (adjusted.bugRisk > 3) {
      adjusted.bugRisk = 3;
      appliedRules.push({ rule: 'CI_FAILURE', category: 'bugRisk', action: 'Capped at 3', reason: 'CI failed' });
    }
    if (adjusted.deliverySpeed > 4) {
      adjusted.deliverySpeed = 4;
      appliedRules.push({ rule: 'CI_FAILURE', category: 'deliverySpeed', action: 'Capped at 4', reason: 'CI failed' });
    }
  }

  // ESLint > 50 errors → codeQuality ≤ 4
  if ((staticReport?.eslintErrors || 0) > 50) {
    if (adjusted.codeQuality > 4) {
      adjusted.codeQuality = 4;
      appliedRules.push({ rule: 'ESLINT_ERRORS_HIGH', category: 'codeQuality', action: 'Capped at 4', reason: `${staticReport.eslintErrors} ESLint errors` });
    }
  }

  // Docker issues ≥ 3 → devopsExecution ≤ 4
  if ((staticReport?.dockerIssueCount || 0) >= 3) {
    if (adjusted.devopsExecution > 4) {
      adjusted.devopsExecution = 4;
      appliedRules.push({ rule: 'DOCKER_ISSUES_HIGH', category: 'devopsExecution', action: 'Capped at 4', reason: `${staticReport.dockerIssueCount} Docker issues` });
    }
  }

  // Large diff → collaboration ≤ 4
  if ((staticReport?.prSize || 0) > 2000) {
    if (adjusted.collaboration > 4) {
      adjusted.collaboration = 4;
      appliedRules.push({ rule: 'LARGE_DIFF', category: 'collaboration', action: 'Capped at 4', reason: `PR size ${staticReport.prSize} lines` });
    }
  }

  // No PR description → documentation ≤ 4
  const description = prMetadata?.description || '';
  if (!description || description.trim().length === 0) {
    if (adjusted.documentation > 4) {
      adjusted.documentation = 4;
      appliedRules.push({ rule: 'NO_PR_DESCRIPTION', category: 'documentation', action: 'Capped at 4', reason: 'No PR description' });
    }
  }

  // Clamp all to [0, 10]
  Object.keys(adjusted).forEach((key) => {
    if (typeof adjusted[key] === 'number') {
      adjusted[key] = Math.max(0, Math.min(10, adjusted[key]));
    }
  });

  return { adjustedScores: adjusted, appliedRules };
}

/**
 * Fuse LLM and deterministic scores using weighted combination.
 * If execution evidence is available, boost deterministic weights for evidence-heavy categories.
 */
function fuseScores(llmScores, detScores, hasExecutionEvidence) {
  const fused = {};

  Object.keys(FUSION_WEIGHTS).forEach((category) => {
    const baseWeights = FUSION_WEIGHTS[category];
    const boostWeights = hasExecutionEvidence ? EXECUTION_EVIDENCE_BOOST[category] : null;
    const weights = boostWeights || baseWeights;

    const llmScore = llmScores[category] || 0;
    const detScore = detScores[category] || 0;
    const fusedScore = llmScore * weights.llm + detScore * weights.det;
    fused[category] = Math.max(0, Math.min(10, Math.round(fusedScore * 10) / 10));
  });

  return fused;
}

/**
 * Calculate total score (sum of all 10 categories, 0-100).
 */
function calculateTotalScore(scores) {
  const fields = ['codeQuality', 'problemSolving', 'bugRisk', 'devopsExecution',
    'optimization', 'documentation', 'gitMaturity', 'collaboration', 'deliverySpeed', 'security'];
  return fields.reduce((sum, f) => sum + (scores[f] || 0), 0);
}

/**
 * Calculate raw badge from total score.
 */
function calculateBadge(totalScore) {
  if (totalScore >= BADGE_THRESHOLDS.GREEN) return 'GREEN';
  if (totalScore >= BADGE_THRESHOLDS.YELLOW) return 'YELLOW';
  return 'RED';
}

/**
 * Evaluate verification tier gates and return tier + gate results.
 * @param {Object} gateCtx - { staticReport, executionResult, reflectionRequired, reflectionAnswered, reflectionConsistencyFlag }
 * @returns {{ tier: string, gateResults: Array }}
 */
function evaluateVerificationTier(gateCtx, rawBadge) {
  // Can only be VERIFIED if badge is at least GREEN
  const gateResults = [];

  // Evaluate VERIFIED gates
  let verifiedPassed = true;
  for (const gate of VERIFICATION_GATES.VERIFIED) {
    const passed = gate.check(gateCtx);
    gateResults.push({ gate: gate.id, label: gate.label, passed, tier: 'VERIFIED' });
    if (!passed) verifiedPassed = false;
  }

  // Evaluate PARTIAL gates
  let partialPassed = true;
  for (const gate of VERIFICATION_GATES.PARTIAL) {
    const passed = gate.check(gateCtx);
    const existing = gateResults.find((g) => g.gate === gate.id);
    if (!existing) gateResults.push({ gate: gate.id, label: gate.label, passed, tier: 'PARTIAL' });
    if (!passed) partialPassed = false;
  }

  let tier;
  if (verifiedPassed && rawBadge === 'GREEN') {
    tier = 'VERIFIED';
  } else if (partialPassed && (rawBadge === 'GREEN' || rawBadge === 'YELLOW')) {
    tier = 'PARTIAL';
  } else {
    tier = 'NOT_VERIFIED';
  }

  return { tier, gateResults };
}

/**
 * Build human-readable evidence array.
 */
function buildEvidenceArray(llmScores, staticReport, ciReport, appliedRules, detScores, prMetadata, executionResult) {
  const evidence = [];

  // Execution evidence (highest priority)
  if (executionResult) {
    if (executionResult.dockerBuildSuccess === true) {
      evidence.push(`Docker Build: SUCCESS (${executionResult.dockerBuildDurationMs || '?'}ms)`);
    } else if (executionResult.dockerBuildSuccess === false) {
      evidence.push(executionResult.noDockerfile
        ? 'Docker Build: No Dockerfile found'
        : 'Docker Build: FAILED');
    }

    if (executionResult.hiddenTestPassRate !== null && executionResult.hiddenTestPassRate !== undefined) {
      const rate = Math.round(executionResult.hiddenTestPassRate * 100);
      evidence.push(`Hidden Tests: ${executionResult.hiddenTestPassed}/${executionResult.hiddenTestTotal} passed (${rate}%)`);
      if ((executionResult.failedTestNames || []).length > 0) {
        evidence.push(`Failed tests: ${executionResult.failedTestNames.slice(0, 3).join(', ')}`);
      }
    }

    if (executionResult.timedOut) {
      evidence.push('Execution: Container timed out');
    }
  }

  // CI/CD evidence
  if (ciReport) {
    const statusLabel = { success: 'Passed', failure: 'Failed', no_workflows: 'No workflows', cancelled: 'Cancelled' };
    evidence.push(`CI/CD: ${statusLabel[ciReport.ciStatus] || ciReport.ciStatus}`);
    if (ciReport.testResults) {
      const { passed, failed, total } = ciReport.testResults;
      evidence.push(`CI Tests: ${passed} passed, ${failed} failed of ${total}`);
    }
  }

  // Static analysis evidence
  if (staticReport) {
    const eslintErrors = staticReport.eslintErrors || 0;
    const eslintWarnings = staticReport.eslintWarnings || 0;
    evidence.push(eslintErrors > 0 || eslintWarnings > 0
      ? `ESLint: ${eslintErrors} errors, ${eslintWarnings} warnings`
      : 'ESLint: No issues');

    if ((staticReport.securityAlertCount || 0) > 0) {
      evidence.push(`Security: ${staticReport.securityAlertCount} secret(s) detected`);
    } else {
      evidence.push('Security: No secrets detected');
    }

    if (staticReport.criticalVulns > 0 || staticReport.highVulns > 0) {
      evidence.push(`Dependencies: ${staticReport.criticalVulns} critical, ${staticReport.highVulns} high vulnerabilities`);
    } else if (staticReport.dependencyAuditAvailable) {
      evidence.push('Dependencies: No critical or high vulnerabilities');
    }

    if (staticReport.coverageFound) {
      evidence.push(`Test Coverage: ${staticReport.coveragePercent}%`);
    }

    if (staticReport.dockerIssueCount > 0) {
      evidence.push(`Docker: ${staticReport.dockerIssueCount} static issue(s)`);
    }
    if (staticReport.yamlIssueCount > 0) {
      evidence.push(`YAML: ${staticReport.yamlIssueCount} validation error(s)`);
    }

    const prSize = staticReport.prSize || 0;
    if (prSize > 0) {
      const label = prSize > 2000 ? 'very large' : prSize > 1000 ? 'large' : 'acceptable';
      evidence.push(`PR size: ${prSize} lines (${label})`);
    }
  }

  // PR description
  if (prMetadata) {
    const desc = prMetadata.description || '';
    if (!desc || desc.trim().length === 0) {
      evidence.push('PR description: Not provided');
    } else if (desc.length >= 200) {
      evidence.push('PR description: Detailed');
    } else {
      evidence.push('PR description: Brief');
    }
  }

  // Applied rules
  if (appliedRules && appliedRules.length > 0) {
    appliedRules.forEach((r) => {
      evidence.push(`Rule: ${r.rule} → ${r.category} ${r.action} (${r.reason})`);
    });
  }

  return evidence;
}

/**
 * Main scoring entry point.
 * @param {Object} llmScores       - LLM output scores
 * @param {Object} staticReport    - Static analysis results
 * @param {Object} ciReport        - CI/CD results
 * @param {Object} prMetadata      - PR metadata
 * @param {Object} [executionResult] - Docker eval result (optional, from VPS3)
 * @param {Object} [reflectionCtx] - { required, answered, consistencyFlag } (optional, Phase 3)
 * @returns {Object} Complete score object
 */
function generateScore(llmScores, staticReport, ciReport, prMetadata, executionResult, reflectionCtx) {
  const hasExecution = executionResult && executionResult.dockerBuildSuccess !== null;

  // Step 1: Deterministic scores (now aware of execution evidence)
  const detScores = deterministicService.computeAllDeterministicScores(
    staticReport, ciReport, prMetadata, executionResult
  );

  // Step 2: Sanity rules on LLM scores
  const { adjustedScores, appliedRules } = applyFusionRules(llmScores, staticReport, ciReport, prMetadata);

  // Step 3: Fuse LLM + deterministic
  const fusedScores = fuseScores(adjustedScores, detScores, hasExecution);

  // Step 4: Total score + badge
  const totalScore = calculateTotalScore(fusedScores);
  const badge = calculateBadge(totalScore);

  // Step 5: Verification tier gate evaluation
  const gateCtx = {
    staticReport,
    executionResult: executionResult || null,
    reflectionRequired: reflectionCtx?.required || false,
    reflectionAnswered: reflectionCtx?.answered || false,
    reflectionConsistencyFlag: reflectionCtx?.consistencyFlag || false,
  };
  const { tier, gateResults } = evaluateVerificationTier(gateCtx, badge);

  // Step 6: Build evidence array
  const evidence = buildEvidenceArray(
    adjustedScores, staticReport, ciReport, appliedRules, detScores, prMetadata, executionResult
  );

  // Step 7: Compose detailsJson
  const detailsJson = {
    breakdown: { ...fusedScores },
    summary: llmScores.summary || 'No summary available',
    suggestions: llmScores.suggestions || [],
    evidence,
    gateResults,
    verificationTier: tier,
    raw: {
      llmOutput: llmScores,
      staticReport: staticReport || {},
      detScores,
      rulesApplied: appliedRules,
      executionResult: executionResult || null,
    },
  };

  return {
    // 10 category scores
    codeQuality:     fusedScores.codeQuality,
    problemSolving:  fusedScores.problemSolving,
    bugRisk:         fusedScores.bugRisk,
    devopsExecution: fusedScores.devopsExecution,
    optimization:    fusedScores.optimization,
    documentation:   fusedScores.documentation,
    gitMaturity:     fusedScores.gitMaturity,
    collaboration:   fusedScores.collaboration,
    deliverySpeed:   fusedScores.deliverySpeed,
    security:        fusedScores.security,

    // Legacy
    reliability: Math.round((10 - fusedScores.bugRisk) * 10) / 10,

    totalScore,
    badge,
    verificationTier: tier,
    gateResults,
    detailsJson,
  };
}

module.exports = {
  applyFusionRules,
  fuseScores,
  calculateTotalScore,
  calculateBadge,
  evaluateVerificationTier,
  buildEvidenceArray,
  generateScore,
};
