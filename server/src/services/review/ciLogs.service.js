/**
 * CI Logs Service for Review Worker
 * Fetches GitHub Actions workflow runs and logs for PR analysis
 */

/**
 * Fetch workflow runs for a PR
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name
 * @param {number} prNumber - PR number
 * @returns {Promise<Array>} Workflow runs
 */
async function fetchWorkflowRuns(octokit, repoFullName, prNumber) {
  const [owner, repo] = repoFullName.split('/');

  try {
    // Get PR to find head SHA
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const headSha = pr.head.sha;

    // Get workflow runs for this PR
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      head_sha: headSha,
      per_page: 10,
    });

    return data.workflow_runs || [];
  } catch (error) {
    console.warn(`Failed to fetch workflow runs: ${error.message}`);
    return [];
  }
}

/**
 * Fetch workflow logs for a specific run
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name
 * @param {number} runId - Workflow run ID
 * @returns {Promise<string>} Log content
 */
async function fetchWorkflowLogs(octokit, repoFullName, runId) {
  const [owner, repo] = repoFullName.split('/');

  try {
    // GitHub API returns a redirect URL for logs
    const { headers } = await octokit.request('HEAD /repos/{owner}/{repo}/actions/runs/{run_id}/logs', {
      owner,
      repo,
      run_id: runId,
    });

    // If logs are available, fetch them
    if (headers.location) {
      // Note: GitHub returns logs as a zip file
      // For MVP, we'll just check if logs exist and get run details
      // Full log parsing can be added later
      return 'logs_available';
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch workflow logs for run ${runId}: ${error.message}`);
    return null;
  }
}

/**
 * Extract CI status from workflow runs
 * @param {Array} workflowRuns - Array of workflow runs
 * @returns {Object} CI status summary
 */
function extractCIStatus(workflowRuns) {
  if (!workflowRuns || workflowRuns.length === 0) {
    return {
      ciStatus: 'unknown',
      failures: [],
      duration: 0,
      testResults: {},
      workflowCount: 0,
    };
  }

  // Get the most recent run
  const latestRun = workflowRuns[0];
  const conclusion = latestRun.conclusion || 'unknown';
  const status = latestRun.status || 'unknown';

  // Determine overall status
  let ciStatus = 'unknown';
  if (status === 'completed') {
    ciStatus = conclusion === 'success' ? 'success' : conclusion === 'failure' ? 'failure' : 'cancelled';
  } else if (status === 'in_progress') {
    ciStatus = 'running';
  }

  // Extract failures from run conclusion
  const failures = [];
  if (conclusion === 'failure') {
    failures.push(`Workflow "${latestRun.name}" failed`);
  } else if (conclusion === 'cancelled') {
    failures.push(`Workflow "${latestRun.name}" was cancelled`);
  }

  // Calculate total duration
  const duration = workflowRuns.reduce((sum, run) => {
    if (run.updated_at && run.created_at) {
      const start = new Date(run.created_at);
      const end = new Date(run.updated_at);
      return sum + (end - start) / 1000; // Duration in seconds
    }
    return sum;
  }, 0);

  // Extract test results (basic - can be enhanced)
  const testResults = {
    total: workflowRuns.length,
    passed: workflowRuns.filter((r) => r.conclusion === 'success').length,
    failed: workflowRuns.filter((r) => r.conclusion === 'failure').length,
    cancelled: workflowRuns.filter((r) => r.conclusion === 'cancelled').length,
  };

  return {
    ciStatus,
    failures,
    duration: Math.round(duration),
    testResults,
    workflowCount: workflowRuns.length,
    latestRun: {
      id: latestRun.id,
      name: latestRun.name,
      conclusion: latestRun.conclusion,
      status: latestRun.status,
      createdAt: latestRun.created_at,
      updatedAt: latestRun.updated_at,
    },
  };
}

/**
 * Fetch CI logs for a PR
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name
 * @param {number} prNumber - PR number
 * @returns {Promise<Object>} CI status and logs summary
 */
async function fetchCILogs(octokit, repoFullName, prNumber) {
  try {
    // Fetch workflow runs
    const workflowRuns = await fetchWorkflowRuns(octokit, repoFullName, prNumber);

    if (workflowRuns.length === 0) {
      return {
        ciStatus: 'no_workflows',
        failures: [],
        duration: 0,
        testResults: {},
        workflowCount: 0,
        message: 'No workflow runs found for this PR',
      };
    }

    // Extract status from runs
    const ciStatus = extractCIStatus(workflowRuns);

    // Optionally fetch logs for failed runs (for future enhancement)
    // For MVP, we'll just return the status

    return ciStatus;
  } catch (error) {
    console.error(`Failed to fetch CI logs: ${error.message}`);
    return {
      ciStatus: 'error',
      failures: [`Failed to fetch CI logs: ${error.message}`],
      duration: 0,
      testResults: {},
      workflowCount: 0,
      error: error.message,
    };
  }
}

module.exports = {
  fetchWorkflowRuns,
  fetchWorkflowLogs,
  extractCIStatus,
  fetchCILogs,
};

