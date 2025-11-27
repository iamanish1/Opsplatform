const lessonRepo = require('../repositories/lesson.repo');
const userRepo = require('../repositories/user.repo');

/**
 * Get all lessons with user's completion status
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of lessons with completion status
 */
async function getLessonsWithProgress(userId) {
  // Fetch all lessons
  const lessons = await lessonRepo.findAllLessons();
  
  // Fetch user's progress records
  const userProgress = await lessonRepo.getUserLessonProgress(userId);
  
  // Create a map of lessonId -> progress for quick lookup
  const progressMap = new Map();
  userProgress.forEach((progress) => {
    progressMap.set(progress.lessonId, progress);
  });
  
  // Merge lessons with completion status
  return lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);
    return {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      completed: progress ? progress.completed : false,
    };
  });
}

/**
 * Get single lesson details with completion status
 * @param {string} lessonId - Lesson ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Lesson with completion status
 */
async function getLessonDetails(lessonId, userId) {
  // Fetch lesson
  const lesson = await lessonRepo.findById(lessonId);
  
  if (!lesson) {
    const error = new Error('Lesson not found');
    error.statusCode = 404;
    error.code = 'LESSON_NOT_FOUND';
    throw error;
  }
  
  // Check if user has completed it
  const progress = await lessonRepo.getLessonProgress(userId, lessonId);
  
  return {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    order: lesson.order,
    completed: progress ? progress.completed : false,
    createdAt: lesson.createdAt,
  };
}

/**
 * Mark lesson as complete and check if all lessons are done
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Completion result with onboarding step update status
 */
async function completeLesson(userId, lessonId) {
  // Verify lesson exists
  const lesson = await lessonRepo.findById(lessonId);
  
  if (!lesson) {
    const error = new Error('Lesson not found');
    error.statusCode = 404;
    error.code = 'LESSON_NOT_FOUND';
    throw error;
  }
  
  // Complete the lesson (idempotent - will update if already exists)
  const progress = await lessonRepo.completeLesson(userId, lessonId);
  
  // Count completed and total lessons
  const completedCount = await lessonRepo.countLessonsCompleted(userId);
  const totalCount = await lessonRepo.countTotalLessons();
  
  // Check if all lessons are completed
  let onboardingStepUpdated = false;
  if (completedCount === totalCount && totalCount > 0) {
    // Update user's onboarding step to 2
    await userRepo.update(userId, { onboardingStep: 2 });
    onboardingStepUpdated = true;
  }
  
  return {
    completed: true,
    completedAt: progress.completedAt,
    onboardingStepUpdated,
  };
}

module.exports = {
  getLessonsWithProgress,
  getLessonDetails,
  completeLesson,
};
