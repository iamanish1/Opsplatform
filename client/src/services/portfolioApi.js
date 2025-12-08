/**
 * Portfolio API service
 * Handles all portfolio-related API calls
 */

import { get } from './api';

/**
 * Get all portfolios for the current user
 * @returns {Promise<Object>} Object with portfolios array
 */
export const getUserPortfolios = async () => {
  try {
    const response = await get('/portfolios');
    // Handle both { portfolios: [...] } and direct array responses
    return response.portfolios || response || [];
  } catch (error) {
    console.error('Error fetching user portfolios:', error);
    throw error;
  }
};

/**
 * Get portfolio by slug (public endpoint)
 * @param {string} slug - Portfolio slug
 * @returns {Promise<Object>} Portfolio details
 */
export const getPortfolioBySlug = async (slug) => {
  return get(`/portfolios/${slug}`);
};

/**
 * Get portfolio by submission ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Portfolio details
 */
export const getPortfolioBySubmission = async (submissionId) => {
  return get(`/portfolios/submission/${submissionId}`);
};

export default {
  getUserPortfolios,
  getPortfolioBySlug,
  getPortfolioBySubmission,
};
