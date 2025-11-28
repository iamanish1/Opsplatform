/**
 * Static Analysis Service for Review Worker
 * Runs ESLint, Dockerfile analysis, YAML linting, secret scanning, and git practices analysis
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

  // Common secret patterns
  const secretPatterns = [
    { pattern: /password\s*[:=]\s*["']?[^"'\s]{8,}/i, name: 'Password' },
    { pattern: /api[_-]?key\s*[:=]\s*["']?[^"'\s]{10,}/i, name: 'API Key' },
    { pattern: /secret\s*[:=]\s*["']?[^"'\s]{10,}/i, name: 'Secret' },
    { pattern: /token\s*[:=]\s*["']?[^"'\s]{10,}/i, name: 'Token' },
    { pattern: /\.env/i, name: '.env file reference' },
    { pattern: /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/i, name: 'Private Key' },
    { pattern: /aws[_-]?access[_-]?key/i, name: 'AWS Access Key' },
    { pattern: /aws[_-]?secret[_-]?access[_-]?key/i, name: 'AWS Secret Key' },
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
 * Run all static analysis tools
 * @param {Array} prFiles - PR files with content
 * @param {Object} prMetadata - PR metadata
 * @returns {Promise<Object>} Combined static analysis report
 */
async function runStaticAnalysis(prFiles, prMetadata) {
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
  };
}

module.exports = {
  runESLint,
  runHadolint,
  runYAMLLint,
  scanSecrets,
  analyzeGitPractices,
  runStaticAnalysis,
};

