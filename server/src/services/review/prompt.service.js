/**
 * Prompt Service for Review Worker
 * Builds LLM prompts from PR data, static analysis, and CI results
 */

/**
 * Summarize diff for prompt
 * @param {Array} files - Changed files with diff
 * @returns {string} Diff summary
 */
function summarizeDiff(files) {
  if (!files || files.length === 0) {
    return 'No files changed.';
  }

  const summary = files
    .slice(0, 5) // Top 5 files
    .map((file) => {
      const lines = file.patch ? file.patch.split('\n').slice(0, 50).join('\n') : 'No diff available';
      return `File: ${file.filename}\nStatus: ${file.status}\nChanges: +${file.additions} -${file.deletions}\n\n${lines}`;
    })
    .join('\n\n---\n\n');

  return summary;
}

/**
 * Format static analysis report for prompt
 * @param {Object} staticReport - Static analysis results
 * @returns {string} Formatted static report
 */
function formatStaticReport(staticReport) {
  if (!staticReport) {
    return 'No static analysis available.';
  }

  const parts = [];

  if (staticReport.eslintErrors > 0 || staticReport.eslintWarnings > 0) {
    parts.push(`ESLint: ${staticReport.eslintErrors} errors, ${staticReport.eslintWarnings} warnings`);
  }

  if (staticReport.dockerIssueCount > 0) {
    parts.push(`Docker: ${staticReport.dockerIssueCount} issues found`);
  }

  if (staticReport.yamlIssueCount > 0) {
    parts.push(`YAML: ${staticReport.yamlIssueCount} validation errors`);
  }

  if (staticReport.securityAlertCount > 0) {
    parts.push(`Security: ${staticReport.securityAlertCount} potential secrets found`);
  }

  parts.push(`Files changed: ${staticReport.fileCount}`);
  parts.push(`PR size: ${staticReport.prSize} lines (${staticReport.additions || 0} additions, ${staticReport.deletions || 0} deletions)`);
  parts.push(`Git maturity score: ${staticReport.gitScore}/10`);

  return parts.join('\n');
}

/**
 * Format CI/CD report for prompt
 * @param {Object} ciReport - CI/CD results
 * @returns {string} Formatted CI report
 */
function formatCIReport(ciReport) {
  if (!ciReport) {
    return 'No CI/CD data available.';
  }

  const parts = [];

  parts.push(`CI Status: ${ciReport.ciStatus}`);
  parts.push(`Workflows: ${ciReport.workflowCount}`);

  if (ciReport.failures && ciReport.failures.length > 0) {
    parts.push(`Failures: ${ciReport.failures.join(', ')}`);
  }

  if (ciReport.duration > 0) {
    parts.push(`Duration: ${ciReport.duration} seconds`);
  }

  if (ciReport.testResults) {
    parts.push(`Tests: ${ciReport.testResults.passed} passed, ${ciReport.testResults.failed} failed`);
  }

  return parts.join('\n');
}

/**
 * Build complete LLM prompt
 * @param {Object} prMetadata - PR metadata
 * @param {Object} diffData - PR diff data
 * @param {Object} staticReport - Static analysis results
 * @param {Object} ciReport - CI/CD results
 * @returns {string} Complete prompt for LLM
 */
function buildPrompt(prMetadata, diffData, staticReport, ciReport) {
  const diffSummary = summarizeDiff(diffData.files);
  const staticSummary = formatStaticReport(staticReport);
  const ciSummary = formatCIReport(ciReport);

  const prompt = `You are a senior DevOps reviewer evaluating a Pull Request for a DevOps project.

INPUTS:

PR Summary:
Title: ${prMetadata.title}
Description: ${prMetadata.description || 'No description provided'}
Author: ${prMetadata.author}
Files changed: ${prMetadata.changedFiles}
Additions: +${prMetadata.additions}
Deletions: -${prMetadata.deletions}

Diff Summary (top 5 files):
${diffSummary}

Static Analysis Results:
${staticSummary}

CI/CD Summary:
${ciSummary}

TASK:
Evaluate this PR and score it on 10 parameters (0-10 each, where 10 is excellent):

1. Code Quality - Code cleanliness, readability, best practices
2. Problem Solving - How well the solution addresses the problem
3. Bug Risk - Likelihood of introducing bugs (lower is better, so score inversely: 10 = no risk, 0 = high risk)
4. DevOps Execution - CI/CD setup, Docker, infrastructure as code
5. Optimization - Performance, efficiency, resource usage
6. Documentation - Code comments, README updates, inline docs
7. Git Maturity - Commit quality, PR size, branch management
8. Collaboration - Code review readiness, communication
9. Delivery Speed - Time to implement, efficiency
10. Security - Security best practices, vulnerability prevention

OUTPUT JSON ONLY (no markdown, no explanations, just valid JSON):
{
  "codeQuality": <0-10>,
  "problemSolving": <0-10>,
  "bugRisk": <0-10>,
  "devopsExecution": <0-10>,
  "optimization": <0-10>,
  "documentation": <0-10>,
  "gitMaturity": <0-10>,
  "collaboration": <0-10>,
  "deliverySpeed": <0-10>,
  "security": <0-10>,
  "summary": "<brief 2-3 sentence summary of the PR>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}

Remember: bugRisk should be scored inversely (10 = no risk, 0 = high risk). All other scores are direct (10 = excellent, 0 = poor).`;

  return prompt;
}

module.exports = {
  summarizeDiff,
  formatStaticReport,
  formatCIReport,
  buildPrompt,
};

