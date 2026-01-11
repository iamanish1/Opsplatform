import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for caching review data in localStorage
 * Manages cache lifecycle with TTL (Time To Live)
 * Stores review results to prevent unnecessary API calls
 */
export const useReviewCache = (submissionId, ttlMinutes = 30) => {
  const [cache, setCache] = useState(null);

  // Generate cache key
  const getCacheKey = useCallback((id) => {
    return `review_cache_${id}`;
  }, []);

  // Get cached review data
  const getCachedReview = useCallback((id) => {
    try {
      const key = getCacheKey(id);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      const now = Date.now();
      const cacheAgeMinutes = (now - timestamp) / (1000 * 60);
      
      if (cacheAgeMinutes > ttlMinutes) {
        // Cache expired, remove it
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error reading from cache:', err);
      return null;
    }
  }, [getCacheKey, ttlMinutes]);

  // Cache review data
  const cacheReview = useCallback((id, reviewData) => {
    try {
      const key = getCacheKey(id);
      const cacheData = {
        data: reviewData,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      setCache(reviewData);
    } catch (err) {
      console.error('Error writing to cache:', err);
    }
  }, [getCacheKey]);

  // Clear specific cache entry
  const clearCache = useCallback((id) => {
    try {
      const key = getCacheKey(id);
      localStorage.removeItem(key);
      setCache(null);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, [getCacheKey]);

  // Clear all review caches
  const clearAllCache = useCallback(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('review_cache_')) {
          localStorage.removeItem(key);
        }
      });
      setCache(null);
    } catch (err) {
      console.error('Error clearing all cache:', err);
    }
  }, []);

  // Initialize cache on mount
  useEffect(() => {
    if (submissionId) {
      const cached = getCachedReview(submissionId);
      setCache(cached);
    }
  }, [submissionId, getCachedReview]);

  return {
    cache,              // Cached review data
    cacheReview,        // Function to cache data
    getCachedReview,    // Function to retrieve cached data
    clearCache,         // Function to clear specific cache
    clearAllCache,      // Function to clear all review caches
    isCached: !!cache   // Boolean indicating if data is cached
  };
};
