import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './AuthLayout.module.css';

const AuthLayout = memo(({ children, showBackToHome = true }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={styles.authLayout}>
      {/* Animated background */}
      <div className={styles.authBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
      </div>

      {/* Floating particles */}
      <div className={styles.particles}>
        {[...Array(15)].map((_, i) => {
          const randomX = (i * 7.3) % 50 - 25;
          const randomDuration = 3 + (i * 0.3) % 2;
          const randomDelay = (i * 0.5) % 2;
          
          return (
            <motion.div
              key={i}
              className={styles.particle}
              animate={prefersReducedMotion ? {} : {
                y: [0, -100, 0],
                x: [0, randomX, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={prefersReducedMotion ? {} : {
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: [0.4, 0, 0.6, 1]
              }}
            />
          );
        })}
      </div>

      {/* Header */}
      {showBackToHome && (
        <motion.header
          className={styles.authHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className={styles.headerLogo}>
            <Zap size={24} className={styles.logoIcon} />
            <span className={styles.logoText}>DevHubs</span>
          </Link>
        </motion.header>
      )}

      {/* Content */}
      <div className={styles.authContainer}>
        <motion.div
          className={styles.authContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
