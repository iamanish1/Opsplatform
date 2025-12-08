import { memo, useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import { Shield, Award, TrendingUp } from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp } from '../../../../utils/animations';
import styles from './TrustScoreWidget.module.css';

const TrustScoreWidget = memo(({ score = 88 }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const spring = useSpring(0, { stiffness: 50, damping: 30 });

  useEffect(() => {
    spring.set(score);
  }, [score, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayScore(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  const getBadge = (score) => {
    if (score < 50) return { name: 'RED', color: '#ef4444' };
    if (score < 75) return { name: 'YELLOW', color: '#f59e0b' };
    return { name: 'GREEN', color: '#10b981' };
  };

  const badge = getBadge(displayScore);
  const percentage = (displayScore / 100) * 100;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <GlassCard className={styles.trustScoreWidget}>
      <motion.div
        className={styles.content}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Shield size={24} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Trust Score</h3>
            <p className={styles.subtitle}>Your verified DevOps skills</p>
          </div>
        </div>

        <div className={styles.scoreDisplay}>
          <div className={styles.scoreCircleContainer}>
            <svg className={styles.scoreCircle} viewBox="0 0 160 160">
              <circle
                className={styles.scoreCircleBg}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              <motion.circle
                className={styles.scoreCircleProgress}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={badge.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  filter: `drop-shadow(0 0 8px ${badge.color})`
                }}
              />
            </svg>
            <div className={styles.scoreValue}>
              <motion.span
                className={styles.scoreNumber}
                key={displayScore}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {displayScore}
              </motion.span>
              <span className={styles.scoreMax}>/100</span>
            </div>
          </div>

          <div className={styles.badgeContainer}>
            <motion.div
              className={styles.badge}
              style={{ borderColor: badge.color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <Award size={18} />
              <span>{badge.name}</span>
            </motion.div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerItem}>
            <TrendingUp size={16} />
            <span>+5 from last project</span>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  );
});

TrustScoreWidget.displayName = 'TrustScoreWidget';

export default TrustScoreWidget;
