const lessonsService = require('../lessons.service');
const lessonRepo = require('../../repositories/lesson.repo');
const userRepo = require('../../repositories/user.repo');

jest.mock('../../repositories/lesson.repo');
jest.mock('../../repositories/user.repo');

describe('Lessons Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('completeLesson', () => {
    it('should complete lesson and update onboarding step when all lessons done', async () => {
      const mockLesson = {
        id: 'lesson1',
        title: 'Test Lesson',
      };

      const mockProgress = {
        id: 'progress1',
        completed: true,
        completedAt: new Date(),
      };

      lessonRepo.findById.mockResolvedValue(mockLesson);
      lessonRepo.completeLesson.mockResolvedValue(mockProgress);
      lessonRepo.countLessonsCompleted.mockResolvedValue(3);
      lessonRepo.countTotalLessons.mockResolvedValue(3);
      userRepo.update.mockResolvedValue({});

      const result = await lessonsService.completeLesson('user123', 'lesson1');

      expect(result.completed).toBe(true);
      expect(result.onboardingStepUpdated).toBe(true);
      expect(userRepo.update).toHaveBeenCalledWith('user123', { onboardingStep: 2 });
    });

    it('should complete lesson but not update onboarding step if not all lessons done', async () => {
      const mockLesson = {
        id: 'lesson1',
        title: 'Test Lesson',
      };

      const mockProgress = {
        id: 'progress1',
        completed: true,
        completedAt: new Date(),
      };

      lessonRepo.findById.mockResolvedValue(mockLesson);
      lessonRepo.completeLesson.mockResolvedValue(mockProgress);
      lessonRepo.countLessonsCompleted.mockResolvedValue(2);
      lessonRepo.countTotalLessons.mockResolvedValue(3);

      const result = await lessonsService.completeLesson('user123', 'lesson1');

      expect(result.completed).toBe(true);
      expect(result.onboardingStepUpdated).toBe(false);
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error if lesson not found', async () => {
      lessonRepo.findById.mockResolvedValue(null);

      await expect(lessonsService.completeLesson('user123', 'invalid')).rejects.toThrow(
        'Lesson not found'
      );
    });
  });

  describe('getLessonsWithProgress', () => {
    it('should return lessons with completion status', async () => {
      const mockLessons = [
        { id: 'lesson1', title: 'Lesson 1', order: 1 },
        { id: 'lesson2', title: 'Lesson 2', order: 2 },
      ];

      const mockProgress = [
        { lessonId: 'lesson1', completed: true },
      ];

      lessonRepo.findAllLessons.mockResolvedValue(mockLessons);
      lessonRepo.getUserLessonProgress.mockResolvedValue(mockProgress);

      const result = await lessonsService.getLessonsWithProgress('user123');

      expect(result).toHaveLength(2);
      expect(result[0].completed).toBe(true);
      expect(result[1].completed).toBe(false);
    });
  });
});

