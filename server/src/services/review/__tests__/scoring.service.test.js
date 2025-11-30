const scoringService = require('../scoring.service');
const deterministicService = require('../deterministic.service');

jest.mock('../deterministic.service');

describe('Scoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyFusionRules', () => {
    it('should set security to 0 if secrets found', () => {
      const llmScores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 6,
        deliverySpeed: 7,
        security: 8,
      };

      const staticReport = {
        securityAlertCount: 2,
      };

      const result = scoringService.applyFusionRules(llmScores, staticReport, null, {});

      expect(result.adjustedScores.security).toBe(0);
      expect(result.appliedRules).toContainEqual(
        expect.objectContaining({
          rule: 'SECRET_FOUND',
          category: 'security',
        })
      );
    });

    it('should cap bugRisk and deliverySpeed if CI fails', () => {
      const llmScores = {
        codeQuality: 8,
        bugRisk: 8,
        deliverySpeed: 9,
        security: 7,
        problemSolving: 7,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 6,
      };

      const ciReport = {
        ciStatus: 'failure',
      };

      const result = scoringService.applyFusionRules(llmScores, null, ciReport, {});

      expect(result.adjustedScores.bugRisk).toBeLessThanOrEqual(3);
      expect(result.adjustedScores.deliverySpeed).toBeLessThanOrEqual(4);
    });

    it('should cap codeQuality if ESLint errors high', () => {
      const llmScores = {
        codeQuality: 9,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 6,
        deliverySpeed: 7,
        security: 7,
      };

      const staticReport = {
        eslintErrors: 60,
      };

      const result = scoringService.applyFusionRules(llmScores, staticReport, null, {});

      expect(result.adjustedScores.codeQuality).toBeLessThanOrEqual(4);
    });
  });

  describe('fuseScores', () => {
    it('should combine LLM and deterministic scores with weights', () => {
      const llmScores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 6,
        deliverySpeed: 7,
        security: 7,
      };

      const detScores = {
        codeQuality: 6,
        problemSolving: 5,
        bugRisk: 7,
        devopsExecution: 8,
        optimization: 6,
        documentation: 5,
        gitMaturity: 8,
        collaboration: 5,
        deliverySpeed: 6,
        security: 9,
      };

      const result = scoringService.fuseScores(llmScores, detScores);

      // codeQuality: 0.6 * 8 + 0.4 * 6 = 4.8 + 2.4 = 7.2
      expect(result.codeQuality).toBeCloseTo(7.2, 1);
      expect(result.security).toBeGreaterThan(0);
      expect(result.security).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateTotalScore', () => {
    it('should sum all 10 category scores', () => {
      const scores = {
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 5,
        devopsExecution: 6,
        optimization: 7,
        documentation: 8,
        gitMaturity: 7,
        collaboration: 6,
        deliverySpeed: 7,
        security: 7,
      };

      const total = scoringService.calculateTotalScore(scores);

      expect(total).toBe(72);
    });
  });

  describe('calculateBadge', () => {
    it('should return GREEN for score >= 75', () => {
      expect(scoringService.calculateBadge(80)).toBe('GREEN');
      expect(scoringService.calculateBadge(75)).toBe('GREEN');
    });

    it('should return YELLOW for score >= 50 and < 75', () => {
      expect(scoringService.calculateBadge(60)).toBe('YELLOW');
      expect(scoringService.calculateBadge(50)).toBe('YELLOW');
    });

    it('should return RED for score < 50', () => {
      expect(scoringService.calculateBadge(40)).toBe('RED');
      expect(scoringService.calculateBadge(0)).toBe('RED');
    });
  });
});

