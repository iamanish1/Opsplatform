/**
 * Portfolio Service Tests
 * Unit and integration tests for portfolio generation
 */

const portfolioService = require('../portfolio.service');
const portfolioRepo = require('../../repositories/portfolio.repo');

// Mock dependencies
jest.mock('../../repositories/user.repo');
jest.mock('../../repositories/submission.repo');
jest.mock('../../repositories/portfolio.repo');
jest.mock('../../repositories/prReview.repo');

const userRepo = require('../../repositories/user.repo');
const submissionRepo = require('../../repositories/submission.repo');
const prReviewRepo = require('../../repositories/prReview.repo');

describe('Portfolio Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    test('should generate slug from GitHub username and submission ID', () => {
      const slug = portfolioService.generateSlug('johndoe', 'submission123456789');
      expect(slug).toBe('johndoe-submission');
    });

    test('should throw error if GitHub username is missing', () => {
      expect(() => {
        portfolioService.generateSlug(null, 'submission123');
      }).toThrow('GitHub username is required for slug generation');
    });
  });

  describe('generatePRUrl', () => {
    test('should generate PR URL from HTTPS repo URL', () => {
      const url = portfolioService.generatePRUrl('https://github.com/owner/repo', 12);
      expect(url).toBe('https://github.com/owner/repo/pull/12');
    });

    test('should generate PR URL from SSH repo URL', () => {
      const url = portfolioService.generatePRUrl('git@github.com:owner/repo.git', 12);
      expect(url).toBe('https://github.com/owner/repo/pull/12');
    });

    test('should return null if repoUrl is missing', () => {
      const url = portfolioService.generatePRUrl(null, 12);
      expect(url).toBeNull();
    });

    test('should return null if prNumber is missing', () => {
      const url = portfolioService.generatePRUrl('https://github.com/owner/repo', null);
      expect(url).toBeNull();
    });
  });

  describe('extractStrengthsAndWeaknesses', () => {
    test('should identify strengths from high scores (>=8)', () => {
      const score = {
        codeQuality: 9,
        problemSolving: 8,
        bugRisk: 3,
        devopsExecution: 7,
        optimization: 6,
        documentation: 5,
        gitMaturity: 4,
        collaboration: 3,
        deliverySpeed: 2,
        security: 1,
      };
      const prReview = {};

      const { strengths, weaknesses } = portfolioService.extractStrengthsAndWeaknesses(score, prReview);

      expect(strengths.length).toBeGreaterThan(0);
      expect(strengths.some((s) => s.includes('Code Quality'))).toBe(true);
      expect(strengths.some((s) => s.includes('Problem Solving'))).toBe(true);
    });

    test('should identify weaknesses from low scores (<=5)', () => {
      const score = {
        codeQuality: 9,
        problemSolving: 8,
        bugRisk: 3,
        devopsExecution: 7,
        optimization: 6,
        documentation: 5,
        gitMaturity: 4,
        collaboration: 3,
        deliverySpeed: 2,
        security: 1,
      };
      const prReview = {};

      const { strengths, weaknesses } = portfolioService.extractStrengthsAndWeaknesses(score, prReview);

      expect(weaknesses.length).toBeGreaterThan(0);
      expect(weaknesses.some((w) => w.includes('Bug Risk'))).toBe(true);
      expect(weaknesses.some((w) => w.includes('Security'))).toBe(true);
    });
  });

  describe('buildHeaderSection', () => {
    test('should build header section from user data', () => {
      const user = {
        name: 'John Doe',
        githubUsername: 'johndoe',
        avatar: 'https://avatar.url',
        onboardingStep: 2,
      };

      const header = portfolioService.buildHeaderSection(user);

      expect(header.name).toBe('John Doe');
      expect(header.githubUsername).toBe('johndoe');
      expect(header.avatar).toBe('https://avatar.url');
      expect(header.developerType).toBe('DevOps Beginner');
    });
  });

  describe('buildScoreSection', () => {
    test('should build score section with breakdown and category details', () => {
      const score = {
        totalScore: 75,
        badge: 'GREEN',
        codeQuality: 8,
        problemSolving: 7,
        bugRisk: 6,
        devopsExecution: 8,
        optimization: 7,
        documentation: 7,
        gitMaturity: 8,
        collaboration: 8,
        deliverySpeed: 7,
        security: 9,
        detailsJson: {
          breakdown: {
            codeQuality: 8,
            problemSolving: 7,
            bugRisk: 6,
            devopsExecution: 8,
            optimization: 7,
            documentation: 7,
            gitMaturity: 8,
            collaboration: 8,
            deliverySpeed: 7,
            security: 9,
          },
        },
      };

      const scoreSection = portfolioService.buildScoreSection(score);

      expect(scoreSection.totalScore).toBe(75);
      expect(scoreSection.badge).toBe('GREEN');
      expect(scoreSection.summary).toBe('Production-ready');
      expect(scoreSection.categoryDetails).toHaveLength(10);
    });
  });

  describe('buildProjectSection', () => {
    test('should build project section with PR URL', () => {
      const submission = {
        repoUrl: 'https://github.com/owner/repo',
        prNumber: 12,
      };
      const project = {
        title: 'Test Project',
        description: 'Test Description',
      };

      const projectSection = portfolioService.buildProjectSection(submission, project);

      expect(projectSection.title).toBe('Test Project');
      expect(projectSection.description).toBe('Test Description');
      expect(projectSection.repoUrl).toBe('https://github.com/owner/repo');
      expect(projectSection.prNumber).toBe(12);
      expect(projectSection.prUrl).toBe('https://github.com/owner/repo/pull/12');
    });
  });

  describe('buildTimelineSection', () => {
    test('should build timeline with all events', () => {
      const submission = {
        createdAt: new Date('2024-01-01'),
      };
      const score = {
        createdAt: new Date('2024-01-02'),
      };
      const prReview = {
        createdAt: new Date('2024-01-01T12:00:00'),
      };

      const timeline = portfolioService.buildTimelineSection(submission, score, prReview);

      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline.some((t) => t.event === 'PR Opened')).toBe(true);
      expect(timeline.some((t) => t.event === 'Score Computed')).toBe(true);
      expect(timeline.some((t) => t.event === 'Portfolio Generated')).toBe(true);
    });
  });

  describe('generate (integration)', () => {
    test('should generate complete portfolio for valid submission', async () => {
      const jobData = {
        userId: 'user123',
        submissionId: 'submission123',
        scoreId: 'score123',
      };

      const mockUser = {
        id: 'user123',
        name: 'John Doe',
        githubUsername: 'johndoe',
        avatar: 'https://avatar.url',
        onboardingStep: 2,
      };

      const mockSubmission = {
        id: 'submission123',
        userId: 'user123',
        repoUrl: 'https://github.com/owner/repo',
        prNumber: 12,
        status: 'REVIEWED',
        project: {
          id: 'project123',
          title: 'Test Project',
          description: 'Test Description',
        },
        score: {
          id: 'score123',
          totalScore: 75,
          badge: 'GREEN',
          codeQuality: 8,
          problemSolving: 7,
          bugRisk: 6,
          devopsExecution: 8,
          optimization: 7,
          documentation: 7,
          gitMaturity: 8,
          collaboration: 8,
          deliverySpeed: 7,
          security: 9,
          detailsJson: {
            breakdown: {
              codeQuality: 8,
              problemSolving: 7,
              bugRisk: 6,
              devopsExecution: 8,
              optimization: 7,
              documentation: 7,
              gitMaturity: 8,
              collaboration: 8,
              deliverySpeed: 7,
              security: 9,
            },
            evidence: ['ESLint: 5 errors', 'CI: passed'],
            summary: 'Good work',
            suggestions: ['Improve documentation'],
          },
        },
      };

      const mockPRReview = {
        id: 'review123',
        reviewJson: {
          summary: 'Good work',
          suggestions: ['Improve documentation'],
        },
        staticReport: {
          eslintErrors: 5,
          eslintWarnings: 10,
          dockerIssues: 0,
          securityAlertCount: 0,
        },
      };

      userRepo.findById.mockResolvedValue(mockUser);
      submissionRepo.findById.mockResolvedValue(mockSubmission);
      prReviewRepo.findBySubmissionId.mockResolvedValue(mockPRReview);
      portfolioRepo.upsertBySubmission.mockResolvedValue({
        id: 'portfolio123',
        slug: 'johndoe-submission',
        portfolioJson: {},
      });

      const result = await portfolioService.generate(jobData);

      expect(result.success).toBe(true);
      expect(result.portfolioId).toBe('portfolio123');
      expect(result.slug).toBe('johndoe-submission');
      expect(result.portfolioJson).toHaveProperty('header');
      expect(result.portfolioJson).toHaveProperty('score');
      expect(result.portfolioJson).toHaveProperty('project');
      expect(result.portfolioJson).toHaveProperty('review');
      expect(result.portfolioJson).toHaveProperty('evidence');
      expect(result.portfolioJson).toHaveProperty('timeline');
    });

    test('should throw error if submission is not reviewed', async () => {
      const jobData = {
        userId: 'user123',
        submissionId: 'submission123',
        scoreId: 'score123',
      };

      const mockUser = { id: 'user123' };
      const mockSubmission = {
        id: 'submission123',
        status: 'IN_PROGRESS',
      };

      userRepo.findById.mockResolvedValue(mockUser);
      submissionRepo.findById.mockResolvedValue(mockSubmission);

      await expect(portfolioService.generate(jobData)).rejects.toThrow(
        'Submission submission123 is not reviewed yet'
      );
    });
  });
});

