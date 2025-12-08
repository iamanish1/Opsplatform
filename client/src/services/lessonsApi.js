/**
 * Lessons API service
 * Handles all lesson-related API calls
 */

import { get, post } from './api';

/**
 * Get all lessons with user's completion status
 * @returns {Promise<Array>} Array of lessons with completion status
 */
export const getLessons = async () => {
  return get('/lessons');
};

/**
 * Get single lesson details with completion status
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Lesson details with completion status
 */
export const getLessonDetails = async (lessonId) => {
  return get(`/lessons/${lessonId}`);
};

/**
 * Mark lesson as complete
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Completion result
 */
export const completeLesson = async (lessonId) => {
  return post(`/lessons/${lessonId}/complete`);
};

export default {
  getLessons,
  getLessonDetails,
  completeLesson,
};
