/**
 * User API service
 * Handles all user-related API calls
 */

import { get, patch, post } from './api';

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUser = async () => {
  return get('/user/me');
};

/**
 * Update user profile
 * @param {Object} data - Profile update data (name, avatar)
 * @returns {Promise<Object>} Updated user profile
 */
export const updateUserProfile = async (data) => {
  return patch('/user', data);
};

/**
 * Get onboarding status
 * @returns {Promise<Object>} Onboarding status
 */
export const getOnboardingStatus = async () => {
  return get('/user/onboarding');
};

/**
 * Get notification preferences
 * @returns {Promise<Object>} Notification preferences
 */
export const getNotificationPreferences = async () => {
  return get('/notifications/preferences');
};

/**
 * Update notification preferences
 * @param {Object} data - Preferences to update
 * @returns {Promise<Object>} Updated preferences
 */
export const updateNotificationPreferences = async (data) => {
  return patch('/notifications/preferences', data);
};

/**
 * Link GitHub account
 * @param {Object} githubData - GitHub account data
 * @returns {Promise<Object>} Updated user with GitHub info
 */
export const linkGitHub = async (githubData) => {
  return post('/user/link-github', githubData);
};

export default {
  getCurrentUser,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  getOnboardingStatus,
  linkGitHub,
};
