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

/**
 * Get submission review status and progress
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Status object with status, progress, and timestamp
 */
export const getSubmissionStatus = async (submissionId) => {
  return get(`/submissions/${submissionId}/status`);
};

/**
 * Get detailed AI review results for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Review object with trustScore, categories, summary, suggestions, etc.
 */
export const getReviewDetails = async (submissionId) => {
  return get(`/submissions/${submissionId}/review`);
};

/**
 * Get categorized review breakdown for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Array>} Array of category objects with name, score, and details
 */
export const getReviewCategories = async (submissionId) => {
  return get(`/submissions/${submissionId}/review/categories`);
};

/**
 * Manually fetch and attach PR information from GitHub
 * Useful for debugging when webhook doesn't fire
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Result with prNumber and submission details
 */
export const fetchAndAttachPR = async (submissionId) => {
  return post(`/submissions/${submissionId}/fetch-pr`);
};

export default {
  getSubmissions,
  getSubmissionDetails,
  submitForReview,
  getSubmissionStatus,
  getReviewDetails,
  getReviewCategories,
  fetchAndAttachPR,
};
