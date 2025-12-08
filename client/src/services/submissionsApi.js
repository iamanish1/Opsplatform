/**
 * Submissions API service
 * Handles all submission-related API calls
 */

import { get } from './api';

/**
 * Get all submissions for the current user
 * Note: This endpoint will be implemented in the backend
 * For now, returns empty array - ready for backend integration
 * @returns {Promise<Array>} Array of submissions with project and score data
 */
export const getSubmissions = async () => {
  // TODO: Update endpoint when backend implements GET /api/submissions
  // For now, return empty array to prevent errors
  try {
    // When backend is ready, uncomment:
    // return get('/submissions');
    return [];
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
};

/**
 * Get single submission details with score and reviews
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Submission details with score, reviews, and project info
 */
export const getSubmissionDetails = async (submissionId) => {
  return get(`/submissions/${submissionId}`);
};

export default {
  getSubmissions,
  getSubmissionDetails,
};
