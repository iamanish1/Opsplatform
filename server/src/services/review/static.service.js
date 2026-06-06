/**
 * Static Analysis Service for Review Worker
 * Runs ESLint, Dockerfile analysis, YAML linting, secret scanning,
 * git practices analysis, dependency audit, complexity analysis, and coverage extraction.
 */

const { ESLint } = require('eslint');
const yaml = require('js-yaml');

/**
 * Run ESLint on JavaScript/TypeScript files
 * @param {Array} files - Array of file objects with filename and content
 * @returns {Promise<Object>} ESLint results
 */
async function runESLint(files) {
  const jsFiles = files.filter((file) => {
    const ext = file.filename.split('.').pop();
    return ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext);
  });

  if (jsFiles.length === 0) {
    return {
      eslintErrors: 0,
      eslintWarnings: 0,
      eslintIssues: [],
    };
  }

  try {
    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: {
        extends: ['eslint:recommended'],
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        env: {
          node: true,
          es2022: true,
        },
      },
    });

    const results = [];
    for (const file of jsFiles) {
      try {
        const result = await eslint.lintText(file.content || '', {
          filePath: file.filename,
        });
        results.push(...result);
      } catch (error) {
        // Skip files that can't be linted
        console.warn(`ESLint failed for ${file.filename}:`, error.message);
      }
    }

    const errors = results.reduce((sum, r) => sum + r.errorCount, 0);
    const warnings = results.reduce((sum, r) => sum + r.warningCount, 0);
    const issues = results
      .flatMap((r) =>
        r.messages.map((msg) => ({
          file: r.filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          rule: msg.ruleId,
        }))
      )
      .slice(0, 50); // Limit to 50 issues

    return {
      eslintErrors: errors,
      eslintWarnings: warnings,
      eslintIssues: issues,
    };
  } catch (error) {
    console.error('ESLint analysis failed:', error);
    return {
      eslintErrors: 0,
      eslintWarnings: 0,
      eslintIssues: [],
      error: error.message,
    };
  }
}

/**
 * Analyze Dockerfile (basic checks)
 * @param {Array} files - Array of file objects
 * @returns {Object} Dockerfile analysis results
 */
function runHadolint(files) {
  const dockerfiles = files.filter((file) => {
    return (
      file.filename.toLowerCase() === 'dockerfile' ||
      file.filename.toLowerCase().endsWith('/dockerfile') ||
      file.filename.toLowerCase().includes('dockerfile')
    );
  });

  if (dockerfiles.length === 0) {
    return {
      dockerIssues: [],
      dockerIssueCount: 0,
    };
  }

  const issues = [];
  for (const dockerfile of dockerfiles) {
    const content = dockerfile.content || '';
    const lines = content.split('\n');

    // Basic checks
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const upperLine = line.toUpperCase().trim();

      // Check for root user
      if (upperLine.includes('USER ROOT') || (upperLine.startsWith('RUN') && upperLine.includes('SUDO'))) {
        issues.push({
          file: dockerfile.filename,
          line: lineNum,
          severity: 'warning',
          message: 'Avoid running as root user',
        });
      }

      // Check for apt-get without cleanup
      if (upperLine.includes('APT-GET') && !upperLine.includes('RM') && !upperLine.includes('CLEAN')) {
        issues.push({
          file: dockerfile.filename,
          line: lineNum,
          severity: 'warning',
          message: 'Clean up apt cache to reduce image size',
        });
      }

      // Check for exposed secrets
      if (upperLine.includes('PASSWORD') || upperLine.includes('SECRET') || upperLine.includes('KEY')) {
        issues.push({
          file: dockerfile.filename,
          line: lineNum,
          severity: 'error',
          message: 'Potential secret exposure in Dockerfile',
        });
      }
    });
  }

  return {
    dockerIssues: issues,
    dockerIssueCount: issues.length,
  };
}

/**
 * Validate YAML files (GitHub Actions workflows)
 * @param {Array} files - Array of file objects
 * @returns {Object} YAML validation results
 */
function runYAMLLint(files) {
  const yamlFiles = files.filter((file) => {
    return (
      file.filename.endsWith('.yml') ||
      file.filename.endsWith('.yaml') ||
      file.filename.includes('.github/workflows/')
    );
  });

  if (yamlFiles.length === 0) {
    return {
      yamlIssues: [],
      yamlIssueCount: 0,
    };
  }

  const issues = [];
  for (const yamlFile of yamlFiles) {
    try {
      const content = yamlFile.content || '';
      yaml.load(content); // This will throw if invalid
    } catch (error) {
      issues.push({
        file: yamlFile.filename,
        severity: 'error',
        message: `YAML syntax error: ${error.message}`,
      });
    }
  }

  return {
    yamlIssues: issues,
    yamlIssueCount: issues.length,
  };
}

/**
 * Scan for hardcoded secrets, tokens, passwords
 * @param {Array} files - Array of file objects
 * @returns {Object} Security scan results
 */
function scanSecrets(files) {
  const securityAlerts = [];

  // Extended secret patterns (18 patterns)
  const secretPatterns = [
    { pattern: /password\s*[:=]\s*["']?[^"'\s]{8,}/i, name: 'Password' },
    { pattern: /api[_-]?key\s*[:=]\s*["']?[^"'\s]{10,}/i, name: 'API Key' },
    { pattern: /secret\s*[:=]\s*["']?[^"'\s]{10,}/i, name: 'Secret' },
    { pattern: /token\s*[:=]\s*["']?[^"'\s]{10,}/i, name: 'Token' },
    { pattern: /\.env/i, name: '.env file reference' },
    { pattern: /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/i, name: 'Private Key' },
    { pattern: /aws[_-]?access[_-]?key/i, name: 'AWS Access Key' },
    { pattern: /aws[_-]?secret[_-]?access[_-]?key/i, name: 'AWS Secret Key' },
    // Extended patterns
    { pattern: /Authorization\s*:\s*["']?Bearer\s+[A-Za-z0-9\-._~+/]+=*/i, name: 'JWT Bearer Token' },
    { pattern: /\/\/registry\.npmjs\.org\/:_authToken\s*=\s*[A-Za-z0-9\-._]{10,}/i, name: 'NPM Auth Token' },
    { pattern: /sk_live_[A-Za-z0-9]{20,}/i, name: 'Stripe Secret Key' },
    { pattern: /AC[a-z0-9]{32}:/i, name: 'Twilio Account SID' },
    { pattern: /AAAA[A-Za-z0-9_\-]{178}/i, name: 'Firebase Server Key' },
    { pattern: /SG\.[A-Za-z0-9\-._]{22}\.[A-Za-z0-9\-._]{43}/i, name: 'SendGrid API Key' },
    { pattern: /ghp_[A-Za-z0-9]{36}/i, name: 'GitHub Personal Access Token' },
    { pattern: /ghs_[A-Za-z0-9]{36}/i, name: 'GitHub App Token' },
    { pattern: /mysql:\/\/[^:]+:[^@]+@[^/\s]+/i, name: 'MySQL Connection String with Credentials' },
    { pattern: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^/\s]+/i, name: 'PostgreSQL Connection String with Credentials' },
  ];

  for (const file of files) {
    const content = file.content || '';
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(line)) {
          // Skip if it's a comment or example
          if (!line.trim().startsWith('//') && !line.trim().startsWith('#') && !line.includes('example')) {
            securityAlerts.push({
              file: file.filename,
              line: index + 1,
              type: name,
              severity: 'error',
              message: `Potential ${name.toLowerCase()} found: ${line.substring(0, 50)}...`,
            });
          }
        }
      }
    });
  }

  return {
    securityAlerts: securityAlerts.slice(0, 20), // Limit to 20 alerts
    securityAlertCount: securityAlerts.length,
  };
}

/**
 * Analyze Git practices (PR size, commit messages)
 * @param {Object} prMetadata - PR metadata from GitHub
 * @returns {Object} Git practices analysis
 */
function analyzeGitPractices(prMetadata) {
  const prSize = prMetadata.additions + prMetadata.deletions;
  const fileCount = prMetadata.changedFiles;

  let gitScore = 10; // Start with perfect score

  // Penalize large PRs
  if (prSize > 1000) {
    gitScore -= 3;
  } else if (prSize > 500) {
    gitScore -= 2;
  } else if (prSize > 200) {
    gitScore -= 1;
  }

  // Penalize too many files
  if (fileCount > 20) {
    gitScore -= 2;
  } else if (fileCount > 10) {
    gitScore -= 1;
  }

  // Ensure score is between 0 and 10
  gitScore = Math.max(0, Math.min(10, gitScore));

  return {
    prSize,
    fileCount,
    gitScore,
    issues: prSize > 1000 ? ['PR is very large (>1000 lines). Consider breaking into smaller PRs.'] : [],
  };
}

/**
 * Analyze cyclomatic complexity from added/modified code in the diff.
 * Estimates complexity by counting branch keywords in added lines.
 * @param {Array} files - Array of file objects with filename + patch content
 * @returns {Object} { averageComplexity, maxComplexity, complexFunctions }
 */
function runComplexityAnalysis(files) {
  const BRANCH_KEYWORDS = /\b(if|else if|else|switch|case|for|while|do|catch|\?\s*:|\?\?|&&|\|\|)\b/g;
  const FUNCTION_PATTERN = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\(.*\)\s*\{)/g;

  const jsFiles = files.filter((f) => {
    const ext = (f.filename || '').split('.').pop();
    return ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext);
  });

  if (jsFiles.length === 0) {
    return { averageComplexity: null, maxComplexity: null, complexFunctions: [] };
  }

  let totalComplexity = 0;
  let functionCount = 0;
  let maxComplexity = 0;
  const complexFunctions = [];

  for (const file of jsFiles) {
    const addedLines = (file.patch || '')
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .map((l) => l.slice(1))
      .join('\n');

    // Find functions in added code
    let funcMatch;
    FUNCTION_PATTERN.lastIndex = 0;
    const funcMatches = [];
    while ((funcMatch = FUNCTION_PATTERN.exec(addedLines)) !== null) {
      const name = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
      funcMatches.push({ name, index: funcMatch.index });
    }

    // Estimate complexity per segment between function declarations
    for (let i = 0; i < funcMatches.length; i++) {
      const start = funcMatches[i].index;
      const end = i + 1 < funcMatches.length ? funcMatches[i + 1].index : addedLines.length;
      const segment = addedLines.slice(start, end);

      const branchMatches = segment.match(BRANCH_KEYWORDS) || [];
      const complexity = 1 + branchMatches.length; // cyclomatic = 1 + branches

      totalComplexity += complexity;
      functionCount++;

      if (complexity > maxComplexity) maxComplexity = complexity;
      if (complexity >= 10) {
        complexFunctions.push({ name: funcMatches[i].name, file: file.filename, complexity });
      }
    }

    // Also count branches in file-level code (not in a detected function)
    if (funcMatches.length === 0) {
      const branchCount = (addedLines.match(BRANCH_KEYWORDS) || []).length;
      if (branchCount > 0) {
        totalComplexity += 1 + branchCount;
        functionCount++;
        if (1 + branchCount > maxComplexity) maxComplexity = 1 + branchCount;
      }
    }
  }

  const averageComplexity = functionCount > 0
    ? parseFloat((totalComplexity / functionCount).toFixed(2))
    : null;

  return {
    averageComplexity,
    maxComplexity: maxComplexity || null,
    complexFunctions: complexFunctions.slice(0, 10),
  };
}

/**
 * Extract test coverage percentage from CI log output.
 * Supports Istanbul/NYC, Jest coverage, and pytest-cov output formats.
 * @param {string} ciLogContent - Raw CI log text
 * @returns {{ coveragePercent: number|null, coverageFound: boolean }}
 */
function runTestCoverageExtract(ciLogContent) {
  if (!ciLogContent || typeof ciLogContent !== 'string') {
    return { coveragePercent: null, coverageFound: false };
  }

  // Jest/Istanbul: "All files | 72.34 |" or "Statements : 72.34% ( 123/456 )"
  const jestMatch =
    ciLogContent.match(/All files\s*\|\s*([\d.]+)/) ||
    ciLogContent.match(/Statements\s*(?::|%|coverage).*?([\d.]+)%/i);

  if (jestMatch) {
    return { coveragePercent: parseFloat(jestMatch[1]), coverageFound: true };
  }

  // pytest-cov: "TOTAL ... 72%"
  const pytestMatch = ciLogContent.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/);
  if (pytestMatch) {
    return { coveragePercent: parseInt(pytestMatch[1], 10), coverageFound: true };
  }

  // Go coverage: "coverage: 72.3% of statements"
  const goMatch = ciLogContent.match(/coverage:\s*([\d.]+)%\s+of\s+statements/i);
  if (goMatch) {
    return { coveragePercent: parseFloat(goMatch[1]), coverageFound: true };
  }

  // Generic: "72% coverage" or "coverage: 72%"
  const genericMatch = ciLogContent.match(/(\d+(?:\.\d+)?)\s*%\s*(?:coverage|covered)/i) ||
    ciLogContent.match(/coverage[^:]*:\s*([\d.]+)%/i);
  if (genericMatch) {
    return { coveragePercent: parseFloat(genericMatch[1]), coverageFound: true };
  }

  return { coveragePercent: null, coverageFound: false };
}

/**
 * Analyze package.json dependencies for known vulnerability patterns.
 * This is a lightweight heuristic (no npm audit execution) — looks for
 * dependency versions with well-known CVEs in common packages.
 * For full audit, run `npm audit --json` in the eval worker on VPS3.
 *
 * @param {Array} files - Array of file objects
 * @returns {{ criticalVulns: number, highVulns: number, mediumVulns: number, auditFindings: Array }}
 */
function runDependencyAudit(files) {
  const pkgFile = files.find(
    (f) => f.filename === 'package.json' || f.filename.endsWith('/package.json')
  );

  if (!pkgFile || !pkgFile.patch) {
    return { criticalVulns: 0, highVulns: 0, mediumVulns: 0, auditFindings: [], dependencyAuditAvailable: false };
  }

  // Known vulnerable versions (lightweight heuristic, not exhaustive)
  const KNOWN_VULNERABLE = [
    { pkg: 'lodash', versions: /^[34]\.\d+\.\d+/, severity: 'high', cve: 'CVE-2021-23337' },
    { pkg: 'axios', versions: /^0\.(1[0-9]|2[0-5])/, severity: 'medium', cve: 'CVE-2023-45857' },
    { pkg: 'express', versions: /^3\.\d+/, severity: 'high', cve: 'CVE-2014-6394' },
    { pkg: 'jsonwebtoken', versions: /^[1-7]\.\d+/, severity: 'high', cve: 'CVE-2022-23529' },
    { pkg: 'node-fetch', versions: /^1\.\d+/, severity: 'medium', cve: 'CVE-2022-0235' },
    { pkg: 'minimist', versions: /^0\./, severity: 'critical', cve: 'CVE-2021-44906' },
    { pkg: 'tar', versions: /^[1-3]\.\d+/, severity: 'high', cve: 'CVE-2021-37713' },
    { pkg: 'path-to-regexp', versions: /^0\.[1-5]\./, severity: 'high', cve: 'CVE-2024-45296' },
  ];

  const auditFindings = [];
  let criticalVulns = 0;
  let highVulns = 0;
  let mediumVulns = 0;

  // Extract added lines from patch that look like dependency declarations
  const addedLines = (pkgFile.patch || '')
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .join('\n');

  for (const vuln of KNOWN_VULNERABLE) {
    const depPattern = new RegExp(`"${vuln.pkg}"\\s*:\\s*"([^"]+)"`, 'i');
    const match = addedLines.match(depPattern);
    if (match && vuln.versions.test(match[1])) {
      auditFindings.push({
        package: vuln.pkg,
        version: match[1],
        severity: vuln.severity,
        cve: vuln.cve,
      });
      if (vuln.severity === 'critical') criticalVulns++;
      else if (vuln.severity === 'high') highVulns++;
      else if (vuln.severity === 'medium') mediumVulns++;
    }
  }

  return {
    criticalVulns,
    highVulns,
    mediumVulns,
    auditFindings,
    dependencyAuditAvailable: true,
  };
}

/**
 * Run all static analysis tools
 * @param {Array} prFiles - PR files with content
 * @param {Object} prMetadata - PR metadata
 * @param {string} [ciLogContent] - Raw CI log text (for coverage extraction)
 * @returns {Promise<Object>} Combined static analysis report
 */
async function runStaticAnalysis(prFiles, prMetadata, ciLogContent) {
  // Get file contents (for MVP, we'll work with what we have from GitHub API)
  // In production, you might clone the repo, but for MVP we'll analyze from API data
  const filesWithContent = prFiles.map((file) => ({
    filename: file.filename,
    content: file.patch || '', // Use patch content if available
  }));

  // Run all analyses
  const eslintResult = await runESLint(filesWithContent);
  const dockerResult = runHadolint(filesWithContent);
  const yamlResult = runYAMLLint(filesWithContent);
  const secretResult = scanSecrets(filesWithContent);
  const gitResult = analyzeGitPractices(prMetadata);
  // Extended analyses
  const complexityResult = runComplexityAnalysis(prFiles);
  const depAuditResult = runDependencyAudit(filesWithContent);
  const coverageResult = runTestCoverageExtract(ciLogContent || '');

  return {
    eslintErrors: eslintResult.eslintErrors,
    eslintWarnings: eslintResult.eslintWarnings,
    eslintIssues: eslintResult.eslintIssues,
    dockerIssues: dockerResult.dockerIssues,
    dockerIssueCount: dockerResult.dockerIssueCount,
    yamlIssues: yamlResult.yamlIssues,
    yamlIssueCount: yamlResult.yamlIssueCount,
    securityAlerts: secretResult.securityAlerts,
    securityAlertCount: secretResult.securityAlertCount,
    fileCount: prMetadata.changedFiles,
    prSize: gitResult.prSize,
    gitScore: gitResult.gitScore,
    gitIssues: gitResult.issues,
    // Extended
    averageComplexity: complexityResult.averageComplexity,
    maxComplexity: complexityResult.maxComplexity,
    complexFunctions: complexityResult.complexFunctions,
    criticalVulns: depAuditResult.criticalVulns,
    highVulns: depAuditResult.highVulns,
    mediumVulns: depAuditResult.mediumVulns,
    auditFindings: depAuditResult.auditFindings,
    dependencyAuditAvailable: depAuditResult.dependencyAuditAvailable,
    coveragePercent: coverageResult.coveragePercent,
    coverageFound: coverageResult.coverageFound,
  };
}

module.exports = {
  runESLint,
  runHadolint,
  runYAMLLint,
  scanSecrets,
  analyzeGitPractices,
  runComplexityAnalysis,
  runTestCoverageExtract,
  runDependencyAudit,
  runStaticAnalysis,
};

