/**
 * Scoring Engine Tests
 * Unit and integration tests for scoring engine
 */

const scoringService = require('../scoring.service');
const deterministicService = require('../deterministic.service');

describe('Scoring Engine', () => {
  describe('Deterministic Scoring', () => {
    test('computeCodeQualityDet: ESLint errors reduce score', () => {
      const staticReport = {
        eslintErrors: 20,
        eslintWarnings: 10,
      };
      const score = deterministicService.computeCodeQualityDet(staticReport);
      expect(score).toBeLessThan(10);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('computeSecurityDet: Secrets found = 0', () => {
      const staticReport = {
        securityAlertCount: 1,
      };
      const score = deterministicService.computeSecurityDet(staticReport);
      expect(score).toBe(0);
    });

    test('computeSecurityDet: No secrets = 10', () => {
      const staticReport = {
        securityAlertCount: 0,
      };
      const score = deterministicService.computeSecurityDet(staticReport);
      expect(score).toBe(10);
    });
  });

  describe('Sanity Rules', () => {
    test('Secret found → security = 0', () => {
      const llmScores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 8,
        deliverySpeed: 7,
        security: 9, // LLM says 9, but rule should override
      };
      const staticReport = {
        securityAlertCount: 1,
      };
      const { adjustedScores, appliedRules } = scoringService.applyFusionRules(
        llmScores,
        staticReport,
        {},
        {}
      );
      expect(adjustedScores.security).toBe(0);
      expect(appliedRules.length).toBeGreaterThan(0);
      expect(appliedRules[0].rule).toBe('SECRET_FOUND');
    });

    test('CI failure → bugRisk ≤ 3 & deliverySpeed ≤ 4', () => {
      const llmScores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 8, // Should be capped at 3
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 8,
        deliverySpeed: 9, // Should be capped at 4
        security: 8,
      };
      const ciReport = {
        ciStatus: 'failure',
      };
      const { adjustedScores, appliedRules } = scoringService.applyFusionRules(
        llmScores,
        {},
        ciReport,
        {}
      );
      expect(adjustedScores.bugRisk).toBeLessThanOrEqual(3);
      expect(adjustedScores.deliverySpeed).toBeLessThanOrEqual(4);
      expect(appliedRules.length).toBeGreaterThan(0);
    });

    test('ESLint > 50 → codeQuality ≤ 4', () => {
      const llmScores = {
        codeQuality: 9, // Should be capped at 4
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 8,
        deliverySpeed: 7,
        security: 8,
      };
      const staticReport = {
        eslintErrors: 60,
      };
      const { adjustedScores, appliedRules } = scoringService.applyFusionRules(
        llmScores,
        staticReport,
        {},
        {}
      );
      expect(adjustedScores.codeQuality).toBeLessThanOrEqual(4);
      expect(appliedRules.length).toBeGreaterThan(0);
    });
  });

  describe('Badge Calculation', () => {
    test('calculateBadge: 75+ = GREEN', () => {
      const badge = scoringService.calculateBadge(80);
      expect(badge).toBe('GREEN');
    });

    test('calculateBadge: 50-74 = YELLOW', () => {
      const badge = scoringService.calculateBadge(65);
      expect(badge).toBe('YELLOW');
    });

    test('calculateBadge: <50 = RED', () => {
      const badge = scoringService.calculateBadge(40);
      expect(badge).toBe('RED');
    });
  });

  describe('Total Score Calculation', () => {
    test('calculateTotalScore: Sums all 10 categories', () => {
      const scores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 8,
        deliverySpeed: 7,
        security: 8,
      };
      const total = scoringService.calculateTotalScore(scores);
      expect(total).toBe(71); // Sum of all 10
    });
  });

  describe('Fusion Algorithm', () => {
    test('fuseScores: Combines LLM and deterministic scores', () => {
      const llmScores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 8,
        deliverySpeed: 7,
        security: 8,
      };
      const detScores = {
        codeQuality: 6,
        problemSolving: 5,
        bugRisk: 7,
        devopsExecution: 8,
        optimization: 6,
        documentation: 7,
        gitMaturity: 6,
        collaboration: 7,
        deliverySpeed: 8,
        security: 10,
      };
      const fused = scoringService.fuseScores(llmScores, detScores);
      expect(fused.codeQuality).toBeGreaterThanOrEqual(0);
      expect(fused.codeQuality).toBeLessThanOrEqual(10);
      // Should be weighted combination
      expect(fused.codeQuality).toBeCloseTo(7.2, 1); // 0.6 * 8 + 0.4 * 6 = 7.2
    });
  });

  describe('Evidence Array', () => {
    test('buildEvidenceArray: Collects evidence from all sources', () => {
      const staticReport = {
        eslintErrors: 5,
        eslintWarnings: 3,
        securityAlertCount: 0,
        dockerIssueCount: 2,
        prSize: 450,
        fileCount: 8,
      };
      const ciReport = {
        ciStatus: 'success',
        workflowCount: 2,
        testResults: {
          total: 10,
          passed: 10,
          failed: 0,
        },
      };
      const evidence = scoringService.buildEvidenceArray({}, staticReport, ciReport, [], {}, {});
      expect(evidence.length).toBeGreaterThan(0);
      expect(evidence.some((e) => e.includes('ESLint'))).toBe(true);
      expect(evidence.some((e) => e.includes('CI/CD'))).toBe(true);
    });
  });

  describe('Integration: Complete Score Generation', () => {
    test('generateScore: Produces complete score with all fields', () => {
      const llmScores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 8,
        deliverySpeed: 7,
        security: 8,
        summary: 'Good PR',
        suggestions: ['Improve tests'],
      };
      const staticReport = {
        eslintErrors: 5,
        eslintWarnings: 3,
        securityAlertCount: 0,
        dockerIssueCount: 0,
        yamlIssueCount: 0,
        prSize: 450,
        fileCount: 8,
        gitScore: 8,
      };
      const ciReport = {
        ciStatus: 'success',
        workflowCount: 2,
      };
      const prMetadata = {
        title: 'Test PR',
        description: 'This is a test PR description',
        additions: 200,
        deletions: 50,
        changedFiles: 8,
      };

      const result = scoringService.generateScore(llmScores, staticReport, ciReport, prMetadata);

      // Verify all 10 categories exist
      expect(result.codeQuality).toBeDefined();
      expect(result.problemSolving).toBeDefined();
      expect(result.bugRisk).toBeDefined();
      expect(result.devopsExecution).toBeDefined();
      expect(result.optimization).toBeDefined();
      expect(result.documentation).toBeDefined();
      expect(result.gitMaturity).toBeDefined();
      expect(result.collaboration).toBeDefined();
      expect(result.deliverySpeed).toBeDefined();
      expect(result.security).toBeDefined();

      // Verify total score and badge
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(['GREEN', 'YELLOW', 'RED']).toContain(result.badge);

      // Verify detailsJson structure
      expect(result.detailsJson).toBeDefined();
      expect(result.detailsJson.breakdown).toBeDefined();
      expect(result.detailsJson.evidence).toBeDefined();
      expect(result.detailsJson.raw).toBeDefined();
    });
  });
});

