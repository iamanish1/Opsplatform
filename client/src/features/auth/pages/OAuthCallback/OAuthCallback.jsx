import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { handleAuthCallback, handleAuthCallbackFromUrl } from '../../../../services/authApi';
import { useAuth } from '../../../../contexts/AuthContext';
import { fadeInUp } from '../../../../utils/animations';
import styles from './OAuthCallback.module.css';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');

      // Check for OAuth error
      if (errorParam) {
        setStatus('error');
        setError(decodeURIComponent(errorParam) || 'Authentication was cancelled or failed');
        setTimeout(() => navigate('/auth/student'), 3000);
        return;
      }

      // If token and user are in URL (backend redirected with them)
      if (token && userParam) {
        try {
          const result = handleAuthCallbackFromUrl(searchParams);
          if (result.success) {
            login(result.token, result.user);
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          }
        } catch (err) {
          console.error('Error processing callback from URL:', err);
          setStatus('error');
          setError(err.message || 'Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth/student'), 3000);
        }
        return;
      }

      // If code and state are present (standard OAuth flow)
      if (code && state) {
        try {
          const result = await handleAuthCallback(code, state);
          
          if (result.success) {
            login(result.token, result.user);
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            throw new Error('Authentication failed');
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
          setStatus('error');
          setError(err.message || 'Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth/student'), 3000);
        }
        return;
      }

      // Missing required parameters
      setStatus('error');
      setError('Missing authentication parameters');
      setTimeout(() => navigate('/auth/student'), 3000);
    };

    processCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className={styles.callbackContainer}>
      <motion.div
        className={styles.callbackCard}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {status === 'processing' && (
          <>
            <Loader2 size={48} className={styles.spinner} />
            <h2 className={styles.title}>Completing authentication...</h2>
            <p className={styles.message}>Please wait while we verify your GitHub account.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h2 className={styles.title}>Authentication successful!</h2>
            <p className={styles.message}>Redirecting to your dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle size={48} className={styles.errorIcon} />
            <h2 className={styles.title}>Authentication failed</h2>
            <p className={styles.errorMessage}>{error}</p>
            <p className={styles.redirectText}>Redirecting to login...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default OAuthCallback;

