/**
 * Submissions API service
 * Handles all submission-related API calls
 */

import { get, post } from './api';

/**
 * Get all submissions for the current user
 * @returns {Promise<Array>} Array of submissions with project and score data
 */
export const getSubmissions = async () => {
  return get('/submissions');
};

/**
 * Get single submission details with score and reviews
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Submission details with score, reviews, and project info
 */
export const getSubmissionDetails = async (submissionId) => {
  return get(`/submissions/${submissionId}`);
};

/**
 * Submit project for review (all tasks must be complete)
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Submission result with updated status
 */
export const submitForReview = async (submissionId) => {
  return post(`/submissions/${submissionId}/submit`);
};

export default {
  getSubmissions,
  getSubmissionDetails,
  submitForReview,
};
