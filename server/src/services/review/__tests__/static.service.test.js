const staticService = require('../static.service');

describe('Static Analysis Service', () => {
  describe('runESLint', () => {
    it('should return empty results if no JS files', async () => {
      const files = [
        { filename: 'readme.md', content: '# Readme' },
        { filename: 'config.txt', content: 'config' },
      ];

      const result = await staticService.runESLint(files);

      expect(result.eslintErrors).toBe(0);
      expect(result.eslintWarnings).toBe(0);
      expect(result.eslintIssues).toEqual([]);
    });

    it('should analyze JavaScript files', async () => {
      const files = [
        {
          filename: 'test.js',
          content: 'const x = 1;\nconst y = x;',
        },
      ];

      const result = await staticService.runESLint(files);

      expect(result).toHaveProperty('eslintErrors');
      expect(result).toHaveProperty('eslintWarnings');
      expect(result).toHaveProperty('eslintIssues');
    });
  });

  describe('runHadolint', () => {
    it('should return empty results if no Dockerfile', () => {
      const files = [
        { filename: 'app.js', content: 'console.log("test");' },
      ];

      const result = staticService.runHadolint(files);

      expect(result.dockerIssueCount).toBe(0);
      expect(result.dockerIssues).toEqual([]);
    });

    it('should detect Dockerfile issues', () => {
      const files = [
        {
          filename: 'Dockerfile',
          content: 'FROM node:18\nUSER root\nRUN apt-get install nginx',
        },
      ];

      const result = staticService.runHadolint(files);

      expect(result.dockerIssueCount).toBeGreaterThan(0);
      expect(result.dockerIssues.some((issue) => issue.message.includes('root'))).toBe(true);
    });
  });

  describe('scanSecrets', () => {
    it('should detect potential secrets', () => {
      const files = [
        {
          filename: 'config.js',
          content: 'const password = "secret123";\nconst api_key = "sk-1234567890";',
        },
      ];

      const result = staticService.scanSecrets(files);

      expect(result.securityAlertCount).toBeGreaterThan(0);
      expect(result.securityAlerts.length).toBeGreaterThan(0);
    });

    it('should ignore comments and examples', () => {
      const files = [
        {
          filename: 'config.js',
          content: '// password = "example123"\n# api_key = "example-key"',
        },
      ];

      const result = staticService.scanSecrets(files);

      expect(result.securityAlertCount).toBe(0);
    });
  });

  describe('analyzeGitPractices', () => {
    it('should penalize large PRs', () => {
      const prMetadata = {
        additions: 1500,
        deletions: 500,
        changedFiles: 15,
      };

      const result = staticService.analyzeGitPractices(prMetadata);

      expect(result.prSize).toBe(2000);
      expect(result.gitScore).toBeLessThan(10);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should give good score for small PRs', () => {
      const prMetadata = {
        additions: 50,
        deletions: 10,
        changedFiles: 3,
      };

      const result = staticService.analyzeGitPractices(prMetadata);

      expect(result.gitScore).toBe(10);
    });
  });
});

