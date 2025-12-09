/**
 * Projects API service
 * Handles all project-related API calls
 */

import { get, post } from './api';

/**
 * Get all projects with user's submission status
 * @returns {Promise<Array>} Array of projects with submission status
 */
export const getProjects = async () => {
  return get('/projects');
};

/**
 * Get single project details
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project details with tasks
 */
export const getProjectDetails = async (projectId) => {
  return get(`/projects/${projectId}`);
};

/**
 * Start a project (create submission)
 * @param {string} projectId - Project ID
 * @param {string} repoUrl - Optional repository URL
 * @returns {Promise<Object>} Submission result
 */
export const startProject = async (projectId, repoUrl = null) => {
  return post(`/projects/${projectId}/start`, { repoUrl });
};

export default {
  getProjects,
  getProjectDetails,
  startProject,
};
