import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';
import { handleAuthCallback, handleAuthCallbackFromUrl } from '../../../../services/authApi';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './OAuthCallback.module.css';

const getRedirectPath = (user) => {
  if (!user) return '/dashboard';
  if (user.role === 'COMPANY') return '/company/dashboard';
  if (user.role === 'STUDENT' && user.onboardingStep === 0) return '/onboarding';
  return '/dashboard';
};

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');

      if (errorParam) {
        setStatus('error');
        setError(decodeURIComponent(errorParam) || 'Authentication was cancelled or failed');
        setTimeout(() => navigate('/auth/student'), 3000);
        return;
      }

      if (token && userParam) {
        try {
          const result = handleAuthCallbackFromUrl(searchParams);
          if (result.success) {
            login(result.token, result.user);
            setStatus('success');
            setTimeout(() => navigate(getRedirectPath(result.user)), 1500);
          }
        } catch (err) {
          setStatus('error');
          setError(err.message || 'Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth/student'), 3000);
        }
        return;
      }

      if (code && state) {
        try {
          const result = await handleAuthCallback(code, state);
          if (result.success) {
            login(result.token, result.user);
            setStatus('success');
            setTimeout(() => navigate(getRedirectPath(result.user)), 1500);
          } else {
            throw new Error('Authentication failed');
          }
        } catch (err) {
          setStatus('error');
          setError(err.message || 'Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth/student'), 3000);
        }
        return;
      }

      setStatus('error');
      setError('Missing authentication parameters');
      setTimeout(() => navigate('/auth/student'), 3000);
    };

    processCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className={styles.container}>
      {/* Ambient background */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
      <div className={styles.grid} />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">

          {/* ── Processing ── */}
          {status === 'processing' && (
            <motion.div
              key="processing"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className={styles.brand}>
                <Zap size={13} /><span>DevHubs</span><div className={styles.brandDot} />
              </div>

              <div className={styles.processingRing}>
                <div className={styles.ringTrack} />
                <div className={styles.ringSpinner} />
                <div className={styles.ringDot}><div className={styles.dot} /></div>
              </div>

              <div className={styles.progressBar}>
                <div className={styles.progressFill} />
              </div>

              <h2 className={styles.title}>Verifying your identity</h2>
              <p className={styles.subtitle}>Completing GitHub authentication — just a moment.</p>

              <div className={styles.dots}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`${styles.stepDot} ${styles.stepDotActive}`}
                    style={{ animationDelay: `${i * 0.22}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Success ── */}
          {status === 'success' && (
            <motion.div
              key="success"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.brand}>
                <Zap size={13} /><span>DevHubs</span>
              </div>

              <div className={styles.successRing}>
                <div className={styles.successCircle} />
                <div className={styles.successIconInner}>
                  <CheckCircle2 size={34} />
                </div>
              </div>

              <h2 className={styles.title}>Authentication successful!</h2>
              <p className={styles.subtitle}>Redirecting to your dashboard...</p>

              <div className={styles.dots} style={{ marginTop: '1.5rem' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`${styles.stepDot} ${styles.stepDotActive}`} style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <motion.div
              key="error"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.brand}>
                <Zap size={13} /><span>DevHubs</span>
              </div>

              <div className={styles.errorRing}>
                <div className={styles.errorCircle} />
                <div className={styles.errorIconInner}>
                  <XCircle size={34} />
                </div>
              </div>

              <h2 className={styles.title}>Authentication failed</h2>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <p className={styles.redirectNote}>Redirecting to login in 3 seconds...</p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
