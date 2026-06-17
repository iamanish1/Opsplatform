/**
 * Quick smoke test for testParser.service.js
 * Run: node scripts/test-parser.js
 */
const { parseTestOutput } = require('../src/services/eval/testParser.service');

const cases = [
  {
    name: 'Jest text output',
    output: `
PASS src/auth.test.js
PASS src/user.test.js
FAIL src/submission.test.js
  ● submission › should reject invalid repo

Tests: 1 failed, 8 passed, 9 total
Test Suites: 1 failed, 2 passed, 3 total
    `,
    exitCode: 1,
  },
  {
    name: 'Pytest output',
    output: `
collected 12 items

test_api.py::test_health PASSED
test_api.py::test_auth PASSED
test_api.py::test_submit FAILED

FAILED test_api.py::test_submit - AssertionError: expected 201, got 400

==== 1 failed, 11 passed in 2.34s ====
    `,
    exitCode: 1,
  },
  {
    name: 'Go test output',
    output: `
--- PASS: TestUserCreate (0.12s)
--- PASS: TestUserLogin (0.08s)
--- FAIL: TestSubmission (0.05s)
    submission_test.go:45: expected status 201 got 400
FAIL
ok  	github.com/user/repo	0.25s
    `,
    exitCode: 1,
  },
  {
    name: 'All tests pass (exit 0)',
    output: `
Tests: 5 passed, 5 total
Test Suites: 1 passed, 1 total
    `,
    exitCode: 0,
  },
  {
    name: 'DevHubs JSON format',
    output: JSON.stringify({
      totalTests: 10,
      passed: 7,
      failed: 3,
      skipped: 0,
      passRate: 0.7,
      categories: { auth: { passed: 3, total: 3 }, api: { passed: 4, total: 7 } },
      failedTests: ['api::test_rate_limit', 'api::test_pagination', 'api::test_error_format'],
    }),
    exitCode: 1,
  },
];

let allPassed = true;
for (const tc of cases) {
  const result = parseTestOutput(tc.output, tc.exitCode);
  const ok = typeof result.passRate === 'number' && result.passRate >= 0 && result.passRate <= 1;
  const icon = ok ? '✓' : '✗';
  if (!ok) allPassed = false;
  console.log(`${icon} ${tc.name}`);
  console.log(`    framework=${result.framework}  total=${result.total}  passed=${result.passed}  failed=${result.failed}  passRate=${(result.passRate * 100).toFixed(0)}%`);
  if (result.failedTests?.length) {
    console.log(`    failedTests: ${result.failedTests.join(', ')}`);
  }
  console.log();
}

console.log(allPassed ? '✓ All parser tests passed' : '✗ Some parser tests failed');
process.exit(allPassed ? 0 : 1);
