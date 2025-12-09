/**
 * Authentication API Service
 * Handles GitHub OAuth authentication flow and token management
 */

const AUTH_STORAGE_KEY = 'devhubs_auth_token';
const USER_STORAGE_KEY = 'devhubs_user';

/**
 * Get stored authentication token
 * @returns {string|null} Stored token or null
 */
export const getStoredToken = () => {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading token from storage:', error);
    return null;
  }
};

/**
 * Store authentication token
 * @param {string} token - JWT token to store
 */
export const storeToken = (token) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw new Error('Failed to store authentication token');
  }
};

/**
 * Get stored user data
 * @returns {Object|null} Stored user object or null
 */
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error reading user from storage:', error);
    return null;
  }
};

/**
 * Store user data
 * @param {Object} user - User object to store
 */
export const storeUser = (user) => {
  try {
    if (!user) {
      throw new Error('User data is required');
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
    throw new Error('Failed to store user data');
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Check if user is authenticated
 * Validates token existence and expiration
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getStoredToken();
  if (!token) return false;

  // Basic token validation (check expiration if JWT)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Not a valid JWT format
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      clearAuth();
      return false;
    }
    
    return true;
  } catch (error) {
    // If token parsing fails, assume invalid
    console.error('Error validating token:', error);
    clearAuth();
    return false;
  }
};

/**
 * Initiate GitHub OAuth flow
 * Redirects user to GitHub authorization page
 */
export const initiateGitHubAuth = () => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
    const oauthUrl = `${backendUrl}/api/auth/github`;
    
    // Redirect to backend OAuth endpoint
    window.location.href = oauthUrl;
  } catch (error) {
    console.error('Failed to initiate GitHub OAuth:', error);
    throw new Error('Failed to start authentication process');
  }
};

/**
 * Handle OAuth callback
 * Extracts token from URL or fetches from backend
 * @param {string} code - OAuth authorization code
 * @param {string} state - CSRF state token
 * @returns {Promise<Object>} { success: boolean, token: string, user: Object }
 */
export const handleAuthCallback = async (code, state) => {
  try {
    if (!code || !state) {
      throw new Error('Missing OAuth parameters');
    }

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
    const response = await fetch(
      `${backendUrl}/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: `HTTP error! status: ${response.status}` },
      }));
      throw new Error(error.error?.message || 'Authentication failed');
    }

    const data = await response.json();
    
    if (data.success && data.token && data.user) {
      storeToken(data.token);
      storeUser(data.user);
      return { 
        success: true, 
        token: data.token,
        user: data.user 
      };
    }

    throw new Error('Invalid response from authentication server');
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
};

/**
 * Handle OAuth callback from URL parameters
 * Used when backend redirects with token in URL
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Promise<Object>} { success: boolean, token: string, user: Object }
 */
export const handleAuthCallbackFromUrl = (searchParams) => {
  try {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      throw new Error(decodeURIComponent(error));
    }

    if (!token || !userStr) {
      throw new Error('Missing authentication parameters');
    }

    const user = JSON.parse(decodeURIComponent(userStr));
    
    storeToken(token);
    storeUser(user);
    
    return {
      success: true,
      token,
      user,
    };
  } catch (error) {
    console.error('Error handling callback from URL:', error);
    throw error;
  }
};

export default {
  getStoredToken,
  storeToken,
  getStoredUser,
  storeUser,
  clearAuth,
  isAuthenticated,
  initiateGitHubAuth,
  handleAuthCallback,
  handleAuthCallbackFromUrl,
};

