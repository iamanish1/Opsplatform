const submissionService = require('../submission.service');
const submissionRepo = require('../../repositories/submission.repo');
const projectRepo = require('../../repositories/project.repo');
const projectService = require('../project.service');
const userRepo = require('../../repositories/user.repo');

jest.mock('../../repositories/submission.repo');
jest.mock('../../repositories/project.repo');
jest.mock('../project.service');
jest.mock('../../repositories/user.repo');

describe('Submission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSubmission', () => {
    it('should create new submission if user is eligible and no existing submission', async () => {
      const mockProject = {
        id: 'project1',
        title: 'Test Project',
      };

      const mockSubmission = {
        id: 'submission1',
        userId: 'user123',
        projectId: 'project1',
        repoUrl: 'https://github.com/user/repo',
        status: 'IN_PROGRESS',
      };

      projectService.validateUserEligibility.mockResolvedValue({ eligible: true });
      projectRepo.findById.mockResolvedValue(mockProject);
      submissionRepo.findByUserAndProject.mockResolvedValue(null);
      submissionRepo.create.mockResolvedValue(mockSubmission);
      userRepo.update.mockResolvedValue({});

      const result = await submissionService.startSubmission(
        'user123',
        'project1',
        'https://github.com/user/repo'
      );

      expect(result.submissionId).toBe('submission1');
      expect(result.onboardingStepUpdated).toBe(true);
      expect(submissionRepo.create).toHaveBeenCalled();
      expect(userRepo.update).toHaveBeenCalledWith('user123', { onboardingStep: 3 });
    });

    it('should return existing submission if already exists', async () => {
      const mockProject = {
        id: 'project1',
        title: 'Test Project',
      };

      const existingSubmission = {
        id: 'submission1',
        userId: 'user123',
        projectId: 'project1',
        repoUrl: 'https://github.com/user/repo',
        status: 'IN_PROGRESS',
      };

      projectService.validateUserEligibility.mockResolvedValue({ eligible: true });
      projectRepo.findById.mockResolvedValue(mockProject);
      submissionRepo.findByUserAndProject.mockResolvedValue(existingSubmission);

      const result = await submissionService.startSubmission(
        'user123',
        'project1',
        'https://github.com/user/repo'
      );

      expect(result.submissionId).toBe('submission1');
      expect(result.onboardingStepUpdated).toBe(false);
      expect(submissionRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error if user not eligible', async () => {
      projectService.validateUserEligibility.mockResolvedValue({
        eligible: false,
        reason: 'Not eligible',
        code: 'NOT_ELIGIBLE',
      });

      await expect(
        submissionService.startSubmission('user123', 'project1', 'https://github.com/user/repo')
      ).rejects.toThrow('Not eligible');
    });

    it('should throw error if invalid repo URL', async () => {
      projectService.validateUserEligibility.mockResolvedValue({ eligible: true });
      projectRepo.findById.mockResolvedValue({ id: 'project1' });

      await expect(
        submissionService.startSubmission('user123', 'project1', 'invalid-url')
      ).rejects.toThrow('Invalid repository URL');
    });
  });

  describe('getSubmission', () => {
    it('should return submission details for owner', async () => {
      const mockSubmission = {
        id: 'submission1',
        userId: 'user123',
        projectId: 'project1',
        repoUrl: 'https://github.com/user/repo',
        prNumber: 1,
        status: 'REVIEWED',
        score: {
          codeQuality: 8,
          devopsExecution: 7,
          reliability: 9,
          deliverySpeed: 8,
          collaboration: 7,
          totalScore: 78,
        },
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      submissionRepo.findById.mockResolvedValue(mockSubmission);

      const result = await submissionService.getSubmission('submission1', 'user123');

      expect(result.id).toBe('submission1');
      expect(result.score).toBeDefined();
    });

    it('should throw error if submission not found', async () => {
      submissionRepo.findById.mockResolvedValue(null);

      await expect(
        submissionService.getSubmission('invalid', 'user123')
      ).rejects.toThrow('Submission not found');
    });

    it('should throw error if user does not own submission', async () => {
      const mockSubmission = {
        id: 'submission1',
        userId: 'otheruser',
        projectId: 'project1',
      };

      submissionRepo.findById.mockResolvedValue(mockSubmission);

      await expect(
        submissionService.getSubmission('submission1', 'user123')
      ).rejects.toThrow('Unauthorized access');
    });
  });
});

