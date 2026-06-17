/**
 * End-to-end smoke test for the eval engine.
 * Clones a real GitHub repo, builds its Docker image, runs tests, and prints results.
 *
 * Run: node scripts/test-eval.js [repoUrl] [projectSlug]
 *
 * Examples:
 *   node scripts/test-eval.js https://github.com/iamanish1/test-repo.git cicd-pipeline
 *   node scripts/test-eval.js  (uses built-in sample repo)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { runEvaluation } = require('../src/services/eval/eval.service');

const repoUrl  = process.argv[2] || 'https://github.com/devhubs-io/starter-rest-api';
const slug     = process.argv[3] || 'rest-api-auth';
const subId    = `test-${Date.now()}`;

console.log('╔══════════════════════════════════════════════╗');
console.log('║        DevHubs Eval Engine — Smoke Test      ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`Repo:       ${repoUrl}`);
console.log(`Project:    ${slug}`);
console.log(`SubmissionId: ${subId}`);
console.log('');
console.log('Running eval (this may take 60-120s for Docker build)...\n');

const start = Date.now();

runEvaluation({
  submissionId: subId,
  repoUrl,
  projectSlug: slug,
  hasHiddenTests: false,
})
  .then((result) => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('═══════════════════ RESULT ═══════════════════');
    console.log(`Duration:          ${elapsed}s`);
    console.log(`Docker build:      ${result.dockerBuildSuccess ? '✓ success' : '✗ failed'}  (${result.dockerBuildDurationMs}ms)`);
    console.log(`No Dockerfile:     ${result.noDockerfile}`);
    console.log(`Container exit:    ${result.containerExitCode}`);
    console.log(`Timed out:         ${result.timedOut}`);
    console.log(`Test framework:    ${result.testFramework || 'unknown'}`);
    console.log(`Total tests:       ${result.hiddenTestTotal ?? 'n/a'}`);
    console.log(`Passed:            ${result.hiddenTestPassed ?? 'n/a'}`);
    console.log(`Failed:            ${result.hiddenTestFailed ?? 'n/a'}`);
    console.log(`Pass rate:         ${result.hiddenTestPassRate !== null ? (result.hiddenTestPassRate * 100).toFixed(0) + '%' : 'n/a'}`);
    if (result.evalError) {
      console.log(`\nError:             ${result.evalError}`);
    }
    if (result.failedTestNames?.length) {
      console.log(`\nFailed tests:`);
      result.failedTestNames.forEach((t) => console.log(`  - ${t}`));
    }
    console.log('══════════════════════════════════════════════');
  })
  .catch((err) => {
    console.error('Eval threw an unexpected error:', err.message);
    process.exit(1);
  });
