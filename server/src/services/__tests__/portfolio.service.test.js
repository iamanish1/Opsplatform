const portfolioService = require('../portfolio.service');
const userRepo = require('../../repositories/user.repo');
const submissionRepo = require('../../repositories/submission.repo');
const portfolioRepo = require('../../repositories/portfolio.repo');
const prReviewRepo = require('../../repositories/prReview.repo');

jest.mock('../../repositories/user.repo');
jest.mock('../../repositories/submission.repo');
jest.mock('../../repositories/portfolio.repo');
jest.mock('../../repositories/prReview.repo');

describe('Portfolio Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate portfolio JSON for reviewed submission', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        githubUsername: 'testuser',
        avatar: 'avatar.jpg',
        onboardingStep: 3,
      };

      const mockSubmission = {
        id: 'submission1',
        userId: 'user123',
        projectId: 'project1',
        repoUrl: 'https://github.com/user/repo',
        prNumber: 1,
        status: 'REVIEWED',
        project: {
          id: 'project1',
          title: 'Test Project',
          description: 'Test Description',
        },
        score: {
          id: 'score1',
          totalScore: 75,
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
          detailsJson: {},
        },
      };

      const mockPRReview = {
        id: 'review1',
        submissionId: 'submission1',
        prNumber: 1,
        reviewJson: {},
        staticReport: {},
      };

      const mockPortfolio = {
        id: 'portfolio1',
        slug: 'testuser-submission1',
        portfolioJson: {},
      };

      userRepo.findById.mockResolvedValue(mockUser);
      submissionRepo.findById.mockResolvedValue(mockSubmission);
      prReviewRepo.findBySubmissionId.mockResolvedValue(mockPRReview);
      portfolioRepo.upsertBySubmission.mockResolvedValue(mockPortfolio);

      const result = await portfolioService.generate({
        userId: 'user123',
        submissionId: 'submission1',
        scoreId: 'score1',
      });

      expect(result.success).toBe(true);
      expect(result.portfolioId).toBe('portfolio1');
      expect(result.portfolioJson).toHaveProperty('header');
      expect(result.portfolioJson).toHaveProperty('score');
      expect(result.portfolioJson).toHaveProperty('project');
      expect(portfolioRepo.upsertBySubmission).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(
        portfolioService.generate({
          userId: 'invalid',
          submissionId: 'submission1',
        })
      ).rejects.toThrow('User invalid not found');
    });

    it('should throw error if submission not reviewed', async () => {
      const mockUser = { id: 'user123' };
      const mockSubmission = {
        id: 'submission1',
        status: 'IN_PROGRESS',
      };

      userRepo.findById.mockResolvedValue(mockUser);
      submissionRepo.findById.mockResolvedValue(mockSubmission);

      await expect(
        portfolioService.generate({
          userId: 'user123',
          submissionId: 'submission1',
        })
      ).rejects.toThrow('not reviewed yet');
    });
  });
});

