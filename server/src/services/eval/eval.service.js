/**
 * Eval Orchestration Service — runs on VPS3 only
 *
 * Responsibilities:
 *   1. Clone the student's repo to an isolated temp directory
 *   2. Build the Docker image
 *   3. Run the container against hidden tests (if available for this project)
 *   4. Parse test output
 *   5. Return structured evaluation result
 *   6. Always clean up temp directory and Docker image
 *
 * Results are published back to the review pipeline via Redis pub/sub,
 * so this service has NO database access.  VPS3 must not have DATABASE_URL.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const dockerService = require('./docker.service');
const { parseTestOutput } = require('./testParser.service');
const logger = require('../../utils/logger');

const HIDDEN_TESTS_BASE = process.env.HIDDEN_TESTS_PATH || '/opt/devhubs/hidden-tests';
const EVAL_WORKSPACE = process.env.EVAL_WORKSPACE || path.join(os.tmpdir(), 'devhubs-eval');

// Default test command run inside the container when hidden tests are mounted
// Projects can override via their schema.json
const DEFAULT_TEST_COMMAND =
  process.env.EVAL_TEST_COMMAND ||
  'if [ -f /hidden-tests/runner.sh ]; then /bin/sh /hidden-tests/runner.sh; elif [ -f package.json ]; then npm test 2>&1; else echo "No test runner found"; fi';

/**
 * Clone a git repo to a temporary directory.
 * Uses --depth 1 to avoid fetching full history.
 */
async function cloneRepo(repoUrl, destDir) {
  logger.info({ repoUrl, destDir }, '[Eval] Cloning repo');
  await execFileAsync('git', ['clone', '--depth', '1', repoUrl, destDir], {
    timeout: 60000,
  });
}

/**
 * Remove a directory tree safely (best-effort)
 */
function cleanupDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (_) {
    // Non-fatal
  }
}

/**
 * Load hidden test schema for a project (defines weights, test command override, etc.)
 * Returns null if the project has no hidden tests configured.
 */
function loadHiddenTestSchema(projectSlug) {
  if (!projectSlug) return null;
  const schemaPath = path.join(HIDDEN_TESTS_BASE, projectSlug, 'schema.json');
  if (!fs.existsSync(schemaPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * Main evaluation function.
 *
 * @param {Object} params
 * @param {string} params.submissionId
 * @param {string} params.repoUrl         - Full HTTPS clone URL (https://github.com/owner/repo)
 * @param {string} params.projectSlug     - Used to find hidden test suite
 * @param {boolean} params.hasHiddenTests - Whether this project has hidden tests on VPS3
 * @returns {Promise<EvalResult>}
 */
async function runEvaluation({ submissionId, repoUrl, projectSlug, hasHiddenTests }) {
  const imageTag = `devhubs-eval-${submissionId}`;
  const workDir = path.join(EVAL_WORKSPACE, submissionId);
  const startedAt = new Date().toISOString();

  // Ensure workspace dir exists
  fs.mkdirSync(EVAL_WORKSPACE, { recursive: true });

  const result = {
    submissionId,
    startedAt,
    completedAt: null,
    dockerBuildSuccess: false,
    dockerBuildDurationMs: null,
    dockerBuildLog: null,
    noDockerfile: false,
    containerExitCode: null,
    timedOut: false,
    hiddenTestPassRate: null,
    hiddenTestTotal: null,
    hiddenTestPassed: null,
    hiddenTestFailed: null,
    hiddenTestCategories: null,
    testFramework: null,
    testOutput: null,
    evalError: null,
  };

  try {
    // Step 1: Clone repo
    try {
      await cloneRepo(repoUrl, workDir);
    } catch (cloneErr) {
      result.evalError = `Repo clone failed: ${cloneErr.message}`;
      result.completedAt = new Date().toISOString();
      return result;
    }

    // Step 2: Docker build
    const buildResult = await dockerService.buildImage(imageTag, workDir);
    result.dockerBuildSuccess = buildResult.success;
    result.dockerBuildDurationMs = buildResult.durationMs;
    result.dockerBuildLog = buildResult.log;
    result.noDockerfile = buildResult.noDockerfile || false;

    if (!buildResult.success) {
      result.completedAt = new Date().toISOString();
      return result;
    }

    // Step 3: Determine hidden tests path + test command
    const hiddenTestsPath = hasHiddenTests && projectSlug
      ? path.join(HIDDEN_TESTS_BASE, projectSlug)
      : null;

    const testSchema = loadHiddenTestSchema(projectSlug);
    const testCommand = testSchema?.testCommand || DEFAULT_TEST_COMMAND;

    // Step 4: Run container
    const runResult = await dockerService.runContainer(imageTag, hiddenTestsPath, testCommand);
    result.containerExitCode = runResult.exitCode;
    result.timedOut = runResult.timedOut || false;
    result.testOutput = runResult.output?.slice(-8000); // cap storage

    // Step 5: Parse test output
    const testParsed = parseTestOutput(runResult.output, runResult.exitCode);
    result.hiddenTestPassRate = testParsed.passRate;
    result.hiddenTestTotal = testParsed.total;
    result.hiddenTestPassed = testParsed.passed;
    result.hiddenTestFailed = testParsed.failed;
    result.hiddenTestCategories = testParsed.categories || null;
    result.testFramework = testParsed.framework;
    result.failedTestNames = testParsed.failedTests;

    // If no hidden tests, use exit code as pass/fail signal
    if (!hasHiddenTests || !testSchema) {
      result.hiddenTestPassRate = runResult.exitCode === 0 ? 1.0 : 0.0;
      result.hiddenTestTotal = null;
      result.hiddenTestPassed = null;
    }
  } catch (err) {
    result.evalError = err.message;
    logger.error({ submissionId, error: err.message }, '[Eval] Unexpected error');
  } finally {
    // Always clean up — image removal is best-effort
    await dockerService.removeImage(imageTag).catch(() => {});
    cleanupDir(workDir);
    result.completedAt = new Date().toISOString();
  }

  return result;
}

module.exports = { runEvaluation };
