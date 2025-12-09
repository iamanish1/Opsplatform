/**
 * Base API service for making HTTP requests
 * Handles authentication, error handling, and request configuration
 */

import { getStoredToken, clearAuth } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Callback function for handling authentication errors
 * Set by AuthProvider to handle logout on 401
 */
let onAuthError = null;

/**
 * Set callback for authentication errors
 * @param {Function} callback - Function to call on 401 errors
 */
export const setAuthErrorHandler = (callback) => {
  onAuthError = callback;
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getStoredToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Remove Content-Type if body is FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear authentication data
      clearAuth();
      
      // Call auth error handler if set (e.g., logout from context)
      if (onAuthError) {
        onAuthError();
      }
      
      // Throw error with specific message
      const error = new Error('Authentication required. Please log in again.');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      const error = new Error(errorData.message || errorData.error?.message || 'Request failed');
      error.status = response.status;
      error.code = errorData.error?.code || 'REQUEST_FAILED';
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Return text or empty object for non-JSON responses
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error.status || error.code) {
      throw error;
    }
    
    // Handle network errors
    console.error('API request failed:', error);
    const networkError = new Error('Network error. Please check your connection.');
    networkError.code = 'NETWORK_ERROR';
    networkError.originalError = error;
    throw networkError;
  }
};

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * POST request
 */
export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 */
export const put = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request
 */
export const patch = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

export default {
  get,
  post,
  put,
  patch,
  delete: del,
};
