/**
 * Task Progress API service
 * Handles all task progress-related API calls
 */

import { get, put } from './api';

/**
 * Get all tasks with completion status for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Tasks with completion status and progress
 */
export const getSubmissionTasks = async (submissionId) => {
  return get(`/submissions/${submissionId}/tasks`);
};

/**
 * Update task completion status
 * @param {string} submissionId - Submission ID
 * @param {string} taskId - Task ID
 * @param {boolean} completed - Completion status
 * @returns {Promise<Object>} Updated task and progress information
 */
export const updateTaskStatus = async (submissionId, taskId, completed) => {
  return put(`/submissions/${submissionId}/tasks/${taskId}`, { completed });
};

/**
 * Get progress information for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Progress information (completed, total, percentage)
 */
export const getSubmissionProgress = async (submissionId) => {
  return get(`/submissions/${submissionId}/progress`);
};

export default {
  getSubmissionTasks,
  updateTaskStatus,
  getSubmissionProgress,
};

