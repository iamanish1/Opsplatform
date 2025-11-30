const userService = require('../user.service');
const userRepo = require('../../repositories/user.repo');
const lessonRepo = require('../../repositories/lesson.repo');

jest.mock('../../repositories/user.repo');
jest.mock('../../repositories/lesson.repo');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with computed fields', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        role: 'STUDENT',
        onboardingStep: 2,
        githubUsername: 'testuser',
        githubId: 'github123',
        trustScore: 50,
        badge: 'GREEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepo.findById.mockResolvedValue(mockUser);
      userRepo.getOnboardingProgress.mockResolvedValue({ completed: 3 });
      lessonRepo.countAll.mockResolvedValue(3);

      const result = await userService.getProfile('user123');

      expect(result).toMatchObject({
        id: 'user123',
        name: 'Test User',
        canStartProject: true,
      });
      expect(userRepo.findById).toHaveBeenCalledWith('user123');
    });

    it('should throw error if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(userService.getProfile('invalid')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with allowed fields', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Old Name',
        email: 'test@example.com',
        avatar: 'old.jpg',
      };

      const updatedUser = {
        ...mockUser,
        name: 'New Name',
        avatar: 'new.jpg',
        updatedAt: new Date(),
      };

      userRepo.findById.mockResolvedValue(mockUser);
      userRepo.update.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile('user123', {
        name: 'New Name',
        avatar: 'new.jpg',
      });

      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('new.jpg');
      expect(userRepo.update).toHaveBeenCalledWith('user123', {
        name: 'New Name',
        avatar: 'new.jpg',
      });
    });

    it('should throw error if no valid fields to update', async () => {
      userRepo.findById.mockResolvedValue({ id: 'user123' });

      await expect(
        userService.updateProfile('user123', { invalidField: 'value' })
      ).rejects.toThrow('No valid fields to update');
    });
  });

  describe('computeCanStartProject', () => {
    it('should return true if user has GitHub and completed all lessons', async () => {
      const mockUser = {
        id: 'user123',
        githubId: 'github123',
        githubUsername: 'testuser',
      };

      userRepo.findById.mockResolvedValue(mockUser);
      lessonRepo.countCompletedForUser.mockResolvedValue(3);
      lessonRepo.countAll.mockResolvedValue(3);

      const result = await userService.computeCanStartProject('user123');

      expect(result).toBe(true);
    });

    it('should return false if user has no GitHub', async () => {
      const mockUser = {
        id: 'user123',
        githubId: null,
        githubUsername: null,
      };

      userRepo.findById.mockResolvedValue(mockUser);
      lessonRepo.countCompletedForUser.mockResolvedValue(3);
      lessonRepo.countAll.mockResolvedValue(3);

      const result = await userService.computeCanStartProject('user123');

      expect(result).toBe(false);
    });

    it('should return false if user has not completed all lessons', async () => {
      const mockUser = {
        id: 'user123',
        githubId: 'github123',
      };

      userRepo.findById.mockResolvedValue(mockUser);
      lessonRepo.countCompletedForUser.mockResolvedValue(2);
      lessonRepo.countAll.mockResolvedValue(3);

      const result = await userService.computeCanStartProject('user123');

      expect(result).toBe(false);
    });
  });
});

