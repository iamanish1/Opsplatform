const projectService = require('../project.service');
const projectRepo = require('../../repositories/project.repo');
const userRepo = require('../../repositories/user.repo');
const lessonRepo = require('../../repositories/lesson.repo');

jest.mock('../../repositories/project.repo');
jest.mock('../../repositories/user.repo');
jest.mock('../../repositories/lesson.repo');

describe('Project Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUserEligibility', () => {
    it('should return eligible if user has GitHub and completed lessons', async () => {
      const mockUser = {
        id: 'user123',
        githubId: 'github123',
        onboardingStep: 2,
      };

      userRepo.findById.mockResolvedValue(mockUser);

      const result = await projectService.validateUserEligibility('user123');

      expect(result.eligible).toBe(true);
    });

    it('should return not eligible if GitHub OAuth not completed', async () => {
      const mockUser = {
        id: 'user123',
        githubId: null,
        onboardingStep: 0,
      };

      userRepo.findById.mockResolvedValue(mockUser);

      const result = await projectService.validateUserEligibility('user123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('GitHub OAuth not completed');
    });

    it('should return not eligible if lessons not completed', async () => {
      const mockUser = {
        id: 'user123',
        githubId: 'github123',
        onboardingStep: 1,
      };

      userRepo.findById.mockResolvedValue(mockUser);
      lessonRepo.countLessonsCompleted.mockResolvedValue(2);
      lessonRepo.countTotalLessons.mockResolvedValue(3);

      const result = await projectService.validateUserEligibility('user123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('lessons must be completed');
    });

    it('should throw error if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(projectService.validateUserEligibility('invalid')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getProject', () => {
    it('should return project with tasks', async () => {
      const mockProject = {
        id: 'project1',
        title: 'Test Project',
        description: 'Test Description',
        starterRepo: 'https://github.com/test/repo',
        tasksJson: [{ id: 'task1', title: 'Task 1' }],
        createdAt: new Date(),
      };

      projectRepo.findById.mockResolvedValue(mockProject);

      const result = await projectService.getProject('project1');

      expect(result.id).toBe('project1');
      expect(result.tasks).toHaveLength(1);
    });

    it('should throw error if project not found', async () => {
      projectRepo.findById.mockResolvedValue(null);

      await expect(projectService.getProject('invalid')).rejects.toThrow('Project not found');
    });
  });
});

