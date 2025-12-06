import { useState, useEffect, memo } from 'react';
import { motion, useSpring } from 'framer-motion';
import { Shield, TrendingUp, Award, Zap, Target, Code2, Rocket, Info, CheckCircle2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './TrustScore.module.css';

const TrustScore = memo(({ score = 87, animated = true, previousScore = 82 }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const [displayScore, setDisplayScore] = useState(0);
  const spring = useSpring(0, { stiffness: 50, damping: 30 });

  useEffect(() => {
    if (inView && animated) {
      spring.set(score);
    } else if (!animated) {
      setDisplayScore(score);
    }
  }, [inView, score, animated, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayScore(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  const getBadge = (score) => {
    if (score < 50) return { name: 'RED', color: 'rgba(255, 255, 255, 0.6)', bgColor: 'rgba(239, 68, 68, 0.1)', glowColor: 'rgba(239, 68, 68, 0.15)' };
    if (score < 80) return { name: 'YELLOW', color: 'rgba(255, 255, 255, 0.7)', bgColor: 'rgba(245, 158, 11, 0.1)', glowColor: 'rgba(245, 158, 11, 0.15)' };
    return { name: 'GREEN', color: 'rgba(255, 255, 255, 0.8)', bgColor: 'rgba(255, 255, 255, 0.08)', glowColor: 'rgba(255, 255, 255, 0.12)' };
  };

  const badge = getBadge(displayScore);
  const percentage = (displayScore / 100) * 100;
  const scoreChange = score - previousScore;

  // Score breakdown metrics
  const metrics = [
    { label: 'Code Quality', value: 85, icon: Code2 },
    { label: 'DevOps Execution', value: 90, icon: Rocket },
    { label: 'Delivery Speed', value: 88, icon: Zap },
    { label: 'Collaboration', value: 82, icon: Target }
  ];

  return (
    <section className={styles.trustScoreSection}>
      <div className={styles.trustScoreContainer}>
        <motion.div
          className={styles.sectionHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeInUp}
        >
          <h2 className={styles.sectionTitle}>
            Your <span className={styles.gradientText}>Trust Score</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Verified skills that companies trust, powered by AI analysis of your real work
          </p>
        </motion.div>

        {/* What is Trust Score Info Section */}
        <motion.div
          className={styles.infoSection}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeInUp}
        >
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Info size={20} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>What is Trust Score?</h3>
              <p className={styles.infoDescription}>
                Your Trust Score (0-100) is an AI-powered assessment of your DevOps skills based on real project submissions. 
                It evaluates code quality, deployment practices, CI/CD implementation, collaboration, and delivery speed from 
                actual pull requests and deployments. Companies use this verified score to identify skilled developers with proven capabilities.
              </p>
              <div className={styles.infoFeatures}>
                <div className={styles.infoFeature}>
                  <CheckCircle2 size={16} />
                  <span>Based on real code and deployments</span>
                </div>
                <div className={styles.infoFeature}>
                  <CheckCircle2 size={16} />
                  <span>AI-analyzed from your actual work</span>
                </div>
                <div className={styles.infoFeature}>
                  <CheckCircle2 size={16} />
                  <span>Verified by companies for hiring</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          ref={ref}
          className={styles.trustScoreContent}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Main Score Card */}
          <motion.div
            className={styles.trustScoreCard}
            variants={fadeInUp}
            whileHover={{ y: -4, scale: 1.01 }}
            style={{
              '--badge-color': badge.color,
              '--badge-bg': badge.bgColor,
              '--badge-glow': badge.glowColor
            }}
          >
            {/* Animated background glow */}
            <div className={styles.cardGlow} />
            
            {/* Floating particles */}
            <div className={styles.cardParticles}>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.particle}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.sin(i) * 15, 0],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>

            <div className={styles.cardContent}>
              <div className={styles.trustScoreHeader}>
                <motion.div
                  className={styles.headerIcon}
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Shield size={22} />
                </motion.div>
                <h3 className={styles.trustScoreTitle}>Trust Score</h3>
              </div>

              <motion.div
                className={styles.trustScoreDisplay}
                variants={fadeInUp}
              >
                <div className={styles.scoreCircleContainer}>
                  {/* Outer glow ring */}
                  <motion.div
                    className={styles.scoreGlowRing}
                    animate={{
                      opacity: [0.3, 0.5, 0.3],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  
                  <svg className={styles.scoreCircle} viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle
                      className={styles.scoreCircleBg}
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      className={styles.scoreCircleProgress}
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke={badge.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 80 * (1 - percentage / 100)
                      }}
                      transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
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
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {displayScore}
                    </motion.span>
                    <span className={styles.scoreMax}>/100</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={styles.trustScoreBadge}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.03 }}
              >
                <Award size={18} />
                <span className={styles.badgeName}>{badge.name}</span>
                <motion.div
                  className={styles.badgeGlow}
                  animate={{
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </motion.div>

              <motion.div
                className={styles.trustScoreFooter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className={styles.scoreChange}>
                  <TrendingUp size={16} />
                  <span>
                    {scoreChange >= 0 ? '+' : ''}{scoreChange} from last project
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Metrics Breakdown */}
          <motion.div
            className={styles.metricsGrid}
            variants={fadeInUp}
          >
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  className={styles.metricCard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                >
                  <div className={styles.metricIcon}>
                    <Icon size={18} />
                  </div>
                  <div className={styles.metricInfo}>
                    <div className={styles.metricLabel}>{metric.label}</div>
                    <div className={styles.metricValue}>
                      <motion.div
                        className={styles.metricBar}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${metric.value}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ backgroundColor: badge.color }}
                      />
                      <span className={styles.metricPercentage}>{metric.value}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

TrustScore.displayName = 'TrustScore';

export default TrustScore;

