import { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredToken } from '../services/authApi';
import { getSubmissionStatus, getReviewDetails } from '../services/submissionsApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Hook for real-time submission review status via Server-Sent Events.
 * Falls back to polling if SSE is unavailable or unsupported.
 *
 * Returns: { status, progress, review, loading, error, refetch }
 */
export const useReviewStatus = (submissionId) => {
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const esRef = useRef(null);       // EventSource instance
  const pollRef = useRef(null);     // Fallback polling interval
  const mountedRef = useRef(true);
  const reviewFetchedRef = useRef(false);

  const TERMINAL = (s) => s === 'REVIEWED' || s === 'ERROR';

  const fetchFullReview = useCallback(async (id) => {
    if (reviewFetchedRef.current) return;
    reviewFetchedRef.current = true;
    try {
      const details = await getReviewDetails(id);
      if (mountedRef.current) setReview(details);
    } catch {
      // Non-fatal — review details may load later
    }
  }, []);

  const applyEvent = useCallback((data, id) => {
    if (!mountedRef.current) return;
    setStatus(data.status || 'PENDING');
    setProgress(data.progress || 0);
    setLoading(false);

    if (data.status === 'REVIEWED') {
      setProgress(100);
      fetchFullReview(id);
    }
    if (data.error) setError(data.error);
  }, [fetchFullReview]);

  // ── Polling fallback ──────────────────────────────────────────
  const startPolling = useCallback((id) => {
    if (pollRef.current) return; // already polling

    const poll = async () => {
      try {
        const res = await getSubmissionStatus(id);
        if (!mountedRef.current) return;
        applyEvent(res, id);
        if (TERMINAL(res.status)) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        if (mountedRef.current) setError(err.message || 'Connection error');
      }
    };

    poll(); // immediate first call
    pollRef.current = setInterval(poll, 3000);
  }, [applyEvent]);

  // ── SSE connection ────────────────────────────────────────────
  const connectSSE = useCallback((id) => {
    if (!window.EventSource) {
      startPolling(id);
      return;
    }

    const token = getStoredToken();
    // EventSource doesn't support custom headers natively.
    // We pass the token as a query param — the backend validates it.
    // This is acceptable because the endpoint already requires authentication
    // and the SSE connection itself is stateful and short-lived.
    const url = `${API_BASE_URL}/submissions/${id}/review-stream?token=${encodeURIComponent(token || '')}`;

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyEvent(data, id);
          if (TERMINAL(data.status)) es.close();
        } catch {
          // malformed event — ignore
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Fall back to polling on SSE failure
        if (mountedRef.current) startPolling(id);
      };
    } catch {
      startPolling(id);
    }
  }, [applyEvent, startPolling]);

  useEffect(() => {
    mountedRef.current = true;
    reviewFetchedRef.current = false;

    if (!submissionId) {
      setLoading(false);
      return;
    }

    connectSSE(submissionId);

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [submissionId, connectSSE]);

  const refetch = useCallback(() => {
    if (!submissionId) return;
    reviewFetchedRef.current = false;
    // Re-fetch current status immediately
    getSubmissionStatus(submissionId)
      .then((res) => { if (mountedRef.current) applyEvent(res, submissionId); })
      .catch((err) => { if (mountedRef.current) setError(err.message); });
  }, [submissionId, applyEvent]);

  return { status, progress, review, loading, error, refetch };
};
