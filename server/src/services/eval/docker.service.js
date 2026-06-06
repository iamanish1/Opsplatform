/**
 * Docker Execution Service — VPS3 only
 *
 * Uses the Docker CLI (child_process) rather than dockerode to avoid an extra
 * dependency.  All student containers run with hard resource limits and zero
 * outbound network access.  Cleanup (rm + rmi) always runs regardless of
 * build/run outcome.
 *
 * Security constraints enforced per container:
 *   --memory 512m --memory-swap 512m   (no swap escape)
 *   --cpus 0.5                          (half a core)
 *   --pids-limit 100                    (no fork bombs)
 *   --network none                      (no outbound)
 *   --read-only / tmpfs combo optional  (not enforced here to allow npm install)
 *
 * NEVER run this service on VPS1 or VPS2.
 */

const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

const EVAL_TIMEOUT_MS = parseInt(process.env.EVAL_TIMEOUT_MS || '90000', 10);
const BUILD_TIMEOUT_MS = parseInt(process.env.DOCKER_BUILD_TIMEOUT_MS || '120000', 10);
const MAX_LOG_LINES = 200;

/**
 * Run a child process, collect stdout+stderr, resolve with { exitCode, output }
 */
function runProcess(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const chunks = [];
    const proc = spawn(cmd, args, {
      ...opts,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (d) => chunks.push(d));
    proc.stderr.on('data', (d) => chunks.push(d));

    const timer = opts.timeout
      ? setTimeout(() => {
          proc.kill('SIGKILL');
          resolve({ exitCode: 124, output: chunks.join(''), timedOut: true });
        }, opts.timeout)
      : null;

    proc.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({ exitCode: code ?? 1, output: Buffer.concat(chunks).toString('utf8') });
    });

    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({ exitCode: 1, output: err.message });
    });
  });
}

/**
 * Build a Docker image from a local repo directory.
 * @param {string} imageTag  - Unique tag for this eval job (e.g. "devhubs-eval-<submissionId>")
 * @param {string} repoPath  - Absolute path to the cloned repo on VPS3
 * @returns {{ success: boolean, durationMs: number, log: string }}
 */
async function buildImage(imageTag, repoPath) {
  const start = Date.now();
  logger.info({ imageTag, repoPath }, '[Docker] Starting image build');

  // Check Dockerfile exists
  const dockerfilePath = path.join(repoPath, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) {
    return {
      success: false,
      durationMs: Date.now() - start,
      log: 'Dockerfile not found in repository root',
      noDockerfile: true,
    };
  }

  const { exitCode, output, timedOut } = await runProcess(
    'docker',
    ['build', '--no-cache', '--pull=false', '-t', imageTag, '.'],
    { cwd: repoPath, timeout: BUILD_TIMEOUT_MS }
  );

  const durationMs = Date.now() - start;
  const logLines = output.split('\n').slice(-MAX_LOG_LINES).join('\n');

  if (timedOut) {
    logger.warn({ imageTag, durationMs }, '[Docker] Build timed out');
    return { success: false, durationMs, log: logLines, timedOut: true };
  }

  const success = exitCode === 0;
  logger.info({ imageTag, success, durationMs, exitCode }, '[Docker] Build complete');
  return { success, durationMs, log: logLines };
}

/**
 * Run a built image with resource constraints and a hidden test volume.
 * @param {string} imageTag         - Image to run
 * @param {string} hiddenTestsPath  - Host path to mount at /hidden-tests (read-only)
 * @param {string} testCommand      - Shell command to run inside the container
 * @returns {{ exitCode: number, output: string, timedOut: boolean }}
 */
async function runContainer(imageTag, hiddenTestsPath, testCommand) {
  logger.info({ imageTag, hiddenTestsPath }, '[Docker] Starting container run');

  const args = [
    'run',
    '--rm',
    // Resource limits
    '--memory', '512m',
    '--memory-swap', '512m',
    '--cpus', '0.5',
    '--pids-limit', '100',
    // Network isolation
    '--network', 'none',
    // Mount hidden tests read-only (only if path exists)
    ...(hiddenTestsPath && fs.existsSync(hiddenTestsPath)
      ? ['--volume', `${hiddenTestsPath}:/hidden-tests:ro`]
      : []),
    // Run as non-root if image supports it
    '--security-opt', 'no-new-privileges',
    imageTag,
    '/bin/sh', '-c', testCommand,
  ];

  const { exitCode, output, timedOut } = await runProcess('docker', args, {
    timeout: EVAL_TIMEOUT_MS,
  });

  logger.info({ imageTag, exitCode, timedOut }, '[Docker] Container finished');
  return { exitCode, output, timedOut };
}

/**
 * Force-remove image (always run after eval, success or failure)
 */
async function removeImage(imageTag) {
  try {
    await runProcess('docker', ['rmi', '-f', imageTag]);
  } catch (_) {
    // Cleanup failure is non-fatal
  }
}

/**
 * Force-remove a stopped/failed container by name (belt-and-suspenders)
 */
async function removeContainer(containerName) {
  try {
    await runProcess('docker', ['rm', '-f', containerName]);
  } catch (_) {
    // Non-fatal
  }
}

/**
 * Check that Docker CLI is available on this host
 */
async function isDockerAvailable() {
  const { exitCode } = await runProcess('docker', ['info'], { timeout: 5000 });
  return exitCode === 0;
}

module.exports = {
  buildImage,
  runContainer,
  removeImage,
  removeContainer,
  isDockerAvailable,
};
