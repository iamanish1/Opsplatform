import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitPullRequest, Shield, Activity, Cpu, Brain,
  BarChart3, Award, CheckCircle2, AlertCircle, Loader2, Zap
} from 'lucide-react';
import styles from './LiveReviewProgress.module.css';

const REVIEW_STEPS = [
  { id: 1, icon: GitPullRequest, label: 'Fetching PR',          desc: 'Reading your pull request from GitHub',       threshold: 24  },
  { id: 2, icon: Shield,         label: 'Static Analysis',      desc: 'ESLint, secrets scan, Dockerfile checks',      threshold: 50  },
  { id: 3, icon: Activity,       label: 'CI/CD Logs',           desc: 'Checking pipeline status and test results',    threshold: 62  },
  { id: 4, icon: Cpu,            label: 'Building Prompt',      desc: 'Assembling optimised AI review context',       threshold: 74  },
  { id: 5, icon: Brain,          label: 'AI Code Review',       desc: 'Groq LLM analysing code quality & patterns',   threshold: 88  },
  { id: 6, icon: BarChart3,      label: 'Computing Scores',     desc: 'Fusion scoring across 10 categories',          threshold: 96  },
  { id: 7, icon: Award,          label: 'Generating Portfolio', desc: 'Creating your shareable trust certificate',    threshold: 100 },
];

const getStepState = (step, progress) => {
  const prev = REVIEW_STEPS[step.id - 2];
  const start = prev ? prev.threshold : 0;
  if (progress >= step.threshold) return 'done';
  if (progress > start) return 'active';
  return 'pending';
};

const LiveReviewProgress = memo(({ status, progress = 0, error }) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  const activeStepIndex = useMemo(() => {
    if (status === 'REVIEWED') return REVIEW_STEPS.length;
    for (let i = REVIEW_STEPS.length - 1; i >= 0; i--) {
      if (safeProgress > (REVIEW_STEPS[i - 1]?.threshold ?? 0)) return i;
    }
    return 0;
  }, [safeProgress, status]);

  if (status === 'REVIEWED') {
    return (
      <motion.div
        className={`${styles.container} ${styles.done}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.doneHeader}>
          <motion.div
            className={styles.doneIcon}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          >
            <CheckCircle2 size={28} />
          </motion.div>
          <div>
            <h3 className={styles.doneTitle}>AI Review Complete</h3>
            <p className={styles.doneSubtitle}>Scroll down to see your full score breakdown</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (status === 'ERROR' || error) {
    return (
      <div className={`${styles.container} ${styles.error}`}>
        <div className={styles.errorHeader}>
          <AlertCircle size={24} />
          <div>
            <h3 className={styles.errorTitle}>Review Failed</h3>
            <p className={styles.errorMsg}>{error || 'Something went wrong. Please try submitting again.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <motion.div
            className={styles.pulsingDot}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className={styles.headerLabel}>AI Review in Progress</span>
        </div>
        <div className={styles.headerRight}>
          <Zap size={14} className={styles.zapIcon} />
          <span className={styles.progressPct}>{safeProgress}%</span>
        </div>
      </div>

      {/* Main progress bar */}
      <div className={styles.mainBarWrap}>
        <div className={styles.mainBar}>
          <motion.div
            className={styles.mainFill}
            initial={{ width: 0 }}
            animate={{ width: `${safeProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Shimmer */}
          <motion.div
            className={styles.shimmer}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        <span className={styles.etaLabel}>~60 seconds remaining</span>
      </div>

      {/* Step list */}
      <div className={styles.steps}>
        {REVIEW_STEPS.map((step, i) => {
          const state = getStepState(step, safeProgress);
          const Icon = step.icon;
          const isActive = state === 'active';
          const isDone = state === 'done';

          return (
            <motion.div
              key={step.id}
              className={`${styles.step} ${isDone ? styles.stepDone : isActive ? styles.stepActive : styles.stepPending}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className={styles.stepIconWrap}>
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <CheckCircle2 size={16} className={styles.doneCheck} />
                  </motion.div>
                ) : isActive ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={16} />
                  </motion.div>
                ) : (
                  <Icon size={16} />
                )}
              </div>

              <div className={styles.stepText}>
                <span className={styles.stepLabel}>{step.label}</span>
                {isActive && (
                  <motion.span
                    className={styles.stepDesc}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {step.desc}
                  </motion.span>
                )}
              </div>

              {isActive && (
                <motion.div
                  className={styles.activeBar}
                  animate={{ scaleX: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

LiveReviewProgress.displayName = 'LiveReviewProgress';
export default LiveReviewProgress;
