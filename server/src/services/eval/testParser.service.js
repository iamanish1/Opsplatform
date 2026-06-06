/**
 * Test Output Parser
 *
 * Detects and parses output from common test runners:
 *   - Jest (JSON reporter or default text)
 *   - Pytest
 *   - Go test
 *   - Mocha
 *   - Generic "X passed, Y failed" patterns
 *
 * Returns a normalized result object:
 * {
 *   totalTests: number,
 *   passed: number,
 *   failed: number,
 *   skipped: number,
 *   passRate: number,          // 0-1
 *   categories: {},            // from hidden test schema (injected separately)
 *   failedTests: string[],     // names of failed tests
 *   framework: string,         // detected runner name
 * }
 */

/**
 * Try to parse Jest JSON output (--json flag)
 */
function parseJestJson(output) {
  const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const total = parsed.numTotalTests || 0;
    const passed = parsed.numPassedTests || 0;
    const failed = parsed.numFailedTests || 0;
    const skipped = parsed.numPendingTests || 0;

    const failedTests = [];
    if (parsed.testResults) {
      for (const suite of parsed.testResults) {
        for (const test of suite.testResults || []) {
          if (test.status === 'failed') {
            failedTests.push(test.fullName || test.title);
          }
        }
      }
    }

    return { total, passed, failed, skipped, failedTests, framework: 'jest-json' };
  } catch (_) {
    return null;
  }
}

/**
 * Try to parse Jest text output
 * e.g. "Tests: 3 failed, 10 passed, 13 total"
 */
function parseJestText(output) {
  const testsLine = output.match(/Tests:\s*(.*)/);
  if (!testsLine) return null;

  const line = testsLine[1];
  const failedMatch = line.match(/(\d+)\s+failed/);
  const passedMatch = line.match(/(\d+)\s+passed/);
  const skippedMatch = line.match(/(\d+)\s+(skipped|pending|todo)/);
  const totalMatch = line.match(/(\d+)\s+total/);

  if (!totalMatch) return null;

  const total = parseInt(totalMatch[1], 10);
  const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const passed = passedMatch ? parseInt(passedMatch[1], 10) : total - failed;
  const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

  // Extract failed test names (● Test name)
  const failedTests = [];
  const bulletMatches = output.matchAll(/● (.+)/g);
  for (const m of bulletMatches) {
    if (!m[1].startsWith('Console') && !m[1].startsWith('Snapshot')) {
      failedTests.push(m[1].trim());
    }
  }

  return { total, passed, failed, skipped, failedTests, framework: 'jest-text' };
}

/**
 * Try to parse pytest output
 * e.g. "3 failed, 10 passed, 1 warning in 2.34s"
 */
function parsePytest(output) {
  const summaryLine = output.match(/(\d+)\s+(?:failed|passed|error).*in\s+[\d.]+s/);
  if (!summaryLine) return null;

  const failedMatch = output.match(/(\d+)\s+failed/);
  const passedMatch = output.match(/(\d+)\s+passed/);
  const errorMatch = output.match(/(\d+)\s+error/);
  const skippedMatch = output.match(/(\d+)\s+skipped/);

  const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
  const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
  const total = failed + errors + passed + skipped;

  // Extract FAILED test names
  const failedTests = [];
  const failedLines = output.matchAll(/FAILED (.+)/g);
  for (const m of failedLines) {
    failedTests.push(m[1].trim());
  }

  return { total, passed, failed: failed + errors, skipped, failedTests, framework: 'pytest' };
}

/**
 * Try to parse Go test output
 * e.g. "--- FAIL: TestFoo (0.01s)"
 *      "ok  \tpackage\t0.123s"
 *      "FAIL\tpackage\t0.123s"
 */
function parseGoTest(output) {
  if (!output.includes('--- PASS') && !output.includes('--- FAIL') && !output.includes('ok  \t')) {
    return null;
  }

  const passedTests = (output.match(/--- PASS:/g) || []).length;
  const failedTests = [];
  const failMatches = output.matchAll(/--- FAIL: (\S+)/g);
  for (const m of failMatches) {
    failedTests.push(m[1]);
  }

  const failed = failedTests.length;
  const total = passedTests + failed;

  return { total, passed: passedTests, failed, skipped: 0, failedTests, framework: 'go-test' };
}

/**
 * Try to parse Mocha output
 * e.g. "3 passing (1s)" / "2 failing"
 */
function parseMocha(output) {
  const passingMatch = output.match(/(\d+)\s+passing/);
  const failingMatch = output.match(/(\d+)\s+failing/);
  const pendingMatch = output.match(/(\d+)\s+pending/);

  if (!passingMatch && !failingMatch) return null;

  const passed = passingMatch ? parseInt(passingMatch[1], 10) : 0;
  const failed = failingMatch ? parseInt(failingMatch[1], 10) : 0;
  const skipped = pendingMatch ? parseInt(pendingMatch[1], 10) : 0;
  const total = passed + failed + skipped;

  const failedTests = [];
  const numberedFails = output.matchAll(/\d+\)\s+(.+)/g);
  for (const m of numberedFails) {
    failedTests.push(m[1].trim());
  }

  return { total, passed, failed, skipped, failedTests, framework: 'mocha' };
}

/**
 * Generic fallback parser — looks for "X passed" / "X failed" anywhere in output
 */
function parseGeneric(output) {
  const passedMatch = output.match(/(\d+)\s+(?:tests?\s+)?passed/i);
  const failedMatch = output.match(/(\d+)\s+(?:tests?\s+)?failed/i);

  if (!passedMatch && !failedMatch) return null;

  const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const total = passed + failed;

  return { total, passed, failed, skipped: 0, failedTests: [], framework: 'generic' };
}

/**
 * Parse DevHubs standard JSON output from runner.sh
 * (The hidden test runner can emit this directly for highest fidelity)
 */
function parseDevHubsJson(output) {
  const jsonMatch = output.match(/\{[\s\S]*"totalTests"[\s\S]*"passRate"[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      total: parsed.totalTests || 0,
      passed: parsed.passed || 0,
      failed: parsed.failed || 0,
      skipped: parsed.skipped || 0,
      passRate: parsed.passRate || 0,
      categories: parsed.categories || {},
      failedTests: parsed.failedTests || [],
      framework: 'devhubs-json',
      _raw: parsed,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Master parser — tries each format in order of specificity.
 * Returns normalized result or a "no tests detected" fallback.
 */
function parseTestOutput(output, containerExitCode) {
  if (!output || output.trim().length === 0) {
    return noTestsResult('Empty container output');
  }

  const result =
    parseDevHubsJson(output) ||
    parseJestJson(output) ||
    parseJestText(output) ||
    parsePytest(output) ||
    parseGoTest(output) ||
    parseMocha(output) ||
    parseGeneric(output);

  if (!result) {
    // No test output detected — infer from exit code
    if (containerExitCode === 0) {
      return noTestsResult('No test output detected — container exited successfully');
    }
    return noTestsResult(`No test output detected — container exited with code ${containerExitCode}`);
  }

  // Normalize passRate
  result.passRate = result.total > 0
    ? parseFloat((result.passed / result.total).toFixed(3))
    : (containerExitCode === 0 ? 1 : 0);

  result.failedTests = (result.failedTests || []).slice(0, 20); // cap for storage

  return result;
}

function noTestsResult(reason) {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: 0,
    categories: {},
    failedTests: [],
    framework: 'none',
    noTestsReason: reason,
  };
}

module.exports = {
  parseTestOutput,
  parseJestJson,
  parseJestText,
  parsePytest,
  parseGoTest,
  parseMocha,
  parseGeneric,
  parseDevHubsJson,
};
