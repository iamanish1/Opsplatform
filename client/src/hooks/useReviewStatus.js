import { useState, useEffect, useRef, useCallback } from 'react';
import { getSubmissionStatus, getReviewDetails } from '../services/submissionsApi';

/**
 * Hook for polling submission review status
 * Polls the backend every 2 seconds until the review is complete
 * Handles loading, error, and completion states
 */
export const useReviewStatus = (submissionId) => {
  const [status, setStatus] = useState('PENDING'); // PENDING, REVIEWING, REVIEWED, ERROR
  const [progress, setProgress] = useState(0); // 0-100
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch the current status
  const fetchStatus = useCallback(async () => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    try {
      const response = await getSubmissionStatus(submissionId);
      
      if (!isMountedRef.current) return;

      setStatus(response.status);
      setProgress(response.progress || 0);
      
      // If review is complete, fetch the full review details
      if (response.status === 'REVIEWED') {
        setProgress(100);
        const reviewDetails = await getReviewDetails(submissionId);
        if (isMountedRef.current) {
          setReview(reviewDetails);
        }
      }
      
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setError(err.message || 'Failed to fetch review status');
      setLoading(false);
      
      // Continue polling even on error (up to 3 retries, then stop)
      if (!err.retryCount) {
        err.retryCount = 0;
      }
      err.retryCount++;
      if (err.retryCount >= 3) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }
  }, [submissionId]);

  // Setup polling
  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Setup interval for polling
    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, 2000); // Poll every 2 seconds

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isMountedRef.current = false;
    };
  }, [submissionId, fetchStatus]);

  // Stop polling once review is complete
  useEffect(() => {
    if (status === 'REVIEWED' && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [status]);

  // Mark component as mounted/unmounted for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    status,        // PENDING, REVIEWING, REVIEWED, ERROR
    progress,      // 0-100 percentage
    review,        // Full review object when status is REVIEWED
    loading,       // True while fetching
    error,         // Error message if any
    refetch: fetchStatus // Manual refetch function
  };
};
