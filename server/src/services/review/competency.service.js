/**
 * Competency Mapping Service (Phase 4)
 *
 * Maps verification scores to SFIA-inspired competency levels (1-5) per domain.
 *
 * Level criteria:
 *   1 — Foundational:  Code builds, CI passes, basic PR description
 *   2 — Practitioner:  Docker build success (or N/A), no secrets, hidden tests >60% (or N/A)
 *   3 — Proficient:    Level 2 + ESLint < 5 errors + reflection score ≥ 6 avg
 *   4 — Advanced:      Level 3 + hidden test pass rate >85% + coverage >50%
 *   5 — Expert:        Level 4 + zero critical/high deps + complexity score ≥ 7
 *
 * Domain categories (which score categories drive competency for each domain):
 *   backend:   problemSolving, bugRisk, security, devopsExecution
 *   frontend:  codeQuality, optimization, documentation, collaboration
 *   fullstack: all 10
 *   devops:    devopsExecution, security, gitMaturity, documentation
 */

const DOMAIN_CATEGORIES = {
  backend:   ['problemSolving', 'bugRisk', 'security', 'devopsExecution'],
  frontend:  ['codeQuality', 'optimization', 'documentation', 'collaboration'],
  fullstack: ['codeQuality', 'problemSolving', 'bugRisk', 'devopsExecution', 'optimization', 'documentation', 'gitMaturity', 'collaboration', 'deliverySpeed', 'security'],
  devops:    ['devopsExecution', 'security', 'gitMaturity', 'documentation'],
};

const LEVEL_NAMES = {
  1: 'Foundational',
  2: 'Practitioner',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert',
};

/**
 * Determine project domain from project model or tags.
 * @param {Object} project - Project model { domain, tags }
 * @returns {string} domain
 */
function detectDomain(project) {
  if (project?.domain && DOMAIN_CATEGORIES[project.domain]) {
    return project.domain;
  }

  const tags = (project?.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => ['devops', 'docker', 'kubernetes', 'ci/cd', 'terraform'].includes(t))) return 'devops';
  if (tags.some((t) => ['react', 'vue', 'angular', 'frontend', 'css', 'html'].includes(t))) return 'frontend';
  if (tags.some((t) => ['backend', 'api', 'node', 'express', 'django', 'flask', 'nestjs'].includes(t))) return 'backend';
  return 'fullstack';
}

/**
 * Compute per-category competency level (1-5) from a normalized score.
 * @param {number} score - 0-10
 * @returns {number} 1-5
 */
function scoreToLevel(score) {
  if (score >= 9) return 5;
  if (score >= 7.5) return 4;
  if (score >= 6) return 3;
  if (score >= 4) return 2;
  return 1;
}

/**
 * Compute overall competency level using gate-based rules.
 *
 * @param {Object} params
 * @param {Object} params.fusedScores    - { codeQuality, problemSolving, ... }
 * @param {Object} params.staticReport   - { eslintErrors, criticalVulns, highVulns, averageComplexity }
 * @param {Object} params.executionResult - { dockerBuildSuccess, hiddenTestPassRate, coveragePercent }
 * @param {number} params.reflectionScore - 0-10 avg, or null
 * @param {string} params.domain
 * @returns {{ level: number, levelName: string, domain: string, breakdown: Object, levelReason: string }}
 */
function computeCompetencyLevel({ fusedScores, staticReport, executionResult, reflectionScore, domain }) {
  const execResult = executionResult || {};
  const report = staticReport || {};

  // Per-category breakdown
  const domainCats = DOMAIN_CATEGORIES[domain] || DOMAIN_CATEGORIES.fullstack;
  const breakdown = {};
  domainCats.forEach((cat) => {
    breakdown[cat] = scoreToLevel(fusedScores[cat] || 0);
  });

  // Gate checks — each level requires ALL gates to pass
  const gates = {
    level1: () => {
      // Code runs, basic PR provided
      return (fusedScores.codeQuality || 0) >= 2 &&
             (fusedScores.documentation || 0) >= 2;
    },
    level2: () => {
      // No secrets, Docker build OK (or not required), hidden tests >60% (or not required)
      const noSecrets = (report.securityAlertCount || 0) === 0;
      const dockerOk = execResult.dockerBuildSuccess !== false; // null = not run = ok
      const testsOk = execResult.hiddenTestPassRate === null ||
                      execResult.hiddenTestPassRate === undefined ||
                      execResult.hiddenTestPassRate >= 0.6;
      return noSecrets && dockerOk && testsOk;
    },
    level3: () => {
      // ESLint < 5 errors AND reflection score ≥ 6 (or no reflection run)
      const eslintOk = (report.eslintErrors || 0) < 5;
      const reflOk = reflectionScore === null || reflectionScore >= 6;
      return eslintOk && reflOk;
    },
    level4: () => {
      // Hidden test pass rate >85% (or N/A) AND coverage >50% (or N/A)
      const testsExcellent = execResult.hiddenTestPassRate === null ||
                              execResult.hiddenTestPassRate === undefined ||
                              execResult.hiddenTestPassRate >= 0.85;
      const coverageOk = (report.coveragePercent === null || report.coveragePercent === undefined) ||
                         report.coveragePercent >= 50;
      return testsExcellent && coverageOk;
    },
    level5: () => {
      // Zero critical/high deps AND average complexity ≤ 8
      const noCritical = (report.criticalVulns || 0) === 0 && (report.highVulns || 0) === 0;
      const complexityOk = report.averageComplexity === null ||
                           report.averageComplexity === undefined ||
                           report.averageComplexity <= 8;
      // Average fused score for domain categories ≥ 8
      const avgDomainScore = domainCats.reduce((s, c) => s + (fusedScores[c] || 0), 0) / domainCats.length;
      return noCritical && complexityOk && avgDomainScore >= 8;
    },
  };

  let level = 0;
  let levelReason = 'Minimum requirements not met';

  if (gates.level1()) { level = 1; levelReason = 'Code compiles and basic PR provided'; }
  if (level >= 1 && gates.level2()) { level = 2; levelReason = 'No secrets, Docker build OK, tests passing'; }
  if (level >= 2 && gates.level3()) { level = 3; levelReason = 'Low lint errors, strong reflection'; }
  if (level >= 3 && gates.level4()) { level = 4; levelReason = 'Excellent test coverage and pass rate'; }
  if (level >= 4 && gates.level5()) { level = 5; levelReason = 'No vulnerabilities, low complexity, high scores'; }

  return {
    level,
    levelName: LEVEL_NAMES[level] || 'Below Foundational',
    domain,
    breakdown,
    levelReason,
  };
}

/**
 * Full competency mapping entry point.
 * Call after scoring is complete.
 *
 * @param {Object} params
 * @param {Object} params.fusedScores
 * @param {Object} params.staticReport
 * @param {Object} params.executionResult
 * @param {number} params.reflectionScore
 * @param {Object} params.project - Project model (for domain detection)
 * @returns {{ level, levelName, domain, breakdown, levelReason }}
 */
function mapCompetency({ fusedScores, staticReport, executionResult, reflectionScore, project }) {
  const domain = detectDomain(project);
  return computeCompetencyLevel({ fusedScores, staticReport, executionResult, reflectionScore, domain });
}

module.exports = {
  mapCompetency,
  detectDomain,
  computeCompetencyLevel,
  scoreToLevel,
  LEVEL_NAMES,
  DOMAIN_CATEGORIES,
};
