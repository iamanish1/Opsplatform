import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as authApi from '../services/authApi';
import { get, setAuthErrorHandler } from '../services/api';

// Create context with undefined as default (not null) to distinguish between "not provided" and "provided but null"
export const AuthContext = createContext(undefined);

/**
 * Authentication Context Provider
 * Manages global authentication state and user data
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up auth error handler for API service
  useEffect(() => {
    setAuthErrorHandler(() => {
      // Handle 401 errors by logging out
      authApi.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      // Use window.location for navigation in error handler (outside component context)
      // This ensures navigation works even if called from API interceptor
      window.location.href = '/auth/student';
    });

    // Cleanup on unmount
    return () => {
      setAuthErrorHandler(null);
    };
  }, []);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authApi.getStoredToken();
        const storedUser = authApi.getStoredUser();

        if (token && storedUser && authApi.isAuthenticated()) {
          // Verify token with backend
          try {
            const currentUser = await get('/user/me');
            setUser(currentUser);
            setIsAuthenticated(true);
          } catch (error) {
            // Token invalid or expired, clear storage
            console.warn('Token validation failed:', error);
            authApi.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No valid token, clear any stale data
          authApi.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authApi.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user with token and user data
   * @param {string} token - JWT token
   * @param {Object} userData - User object
   */
  const login = useCallback((token, userData) => {
    try {
      authApi.storeToken(token);
      authApi.storeUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  /**
   * Logout user and clear all auth data
   * Note: Components should use useNavigate for navigation after calling logout
   * This function only clears auth state - navigation should be handled by the component
   */
  const logout = useCallback(() => {
    authApi.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    // Navigation should be handled by the component using useNavigate
    // This allows for proper React Router navigation without full page reload
  }, []);

  /**
   * Update user data
   * @param {Object} userData - Updated user object
   */
  const updateUser = useCallback((userData) => {
    setUser(userData);
    authApi.storeUser(userData);
  }, []);

  /**
   * Refresh user data from backend
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await get('/user/me');
      setUser(currentUser);
      authApi.storeUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails due to auth error, logout
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
      }
      throw error;
    }
  }, [logout]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, loading, isAuthenticated, login, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

