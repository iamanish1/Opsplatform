import { memo } from 'react';
import { motion } from 'framer-motion';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './MushroomMascot.module.css';

const MushroomMascot = memo(({ 
  size = 'medium', 
  position = { top: '20%', left: '10%' },
  delay = 0,
  variant = 'default'
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizeMap = {
    small: 60,
    medium: 90,
    large: 120
  };

  const width = sizeMap[size] || sizeMap.medium;

  const floatingAnimation = prefersReducedMotion ? {} : {
    y: [0, -20, 0],
    rotate: [0, 2, -2, 0],
    scale: [1, 1.05, 1]
  };

  const breathingAnimation = prefersReducedMotion ? {} : {
    scale: [1, 1.08, 1],
    opacity: [0.4, 0.5, 0.4]
  };

  return (
    <motion.div
      className={styles.mushroomContainer}
      style={{
        top: position.top,
        left: position.left,
        right: position.right,
        bottom: position.bottom,
        width: `${width}px`,
        height: `${width}px`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.svg
        width={width}
        height={width}
        viewBox="0 0 100 100"
        className={styles.mushroomSvg}
        animate={floatingAnimation}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay * 0.5
        }}
      >
        {/* Mushroom Cap */}
        <motion.ellipse
          cx="50"
          cy="35"
          rx="35"
          ry="25"
          fill="url(#mushroomGradient)"
          className={styles.mushroomCap}
          animate={breathingAnimation}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="mushroomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Mushroom Spots */}
        <circle cx="40" cy="30" r="4" fill="rgba(255, 255, 255, 0.3)" />
        <circle cx="55" cy="28" r="3" fill="rgba(255, 255, 255, 0.3)" />
        <circle cx="45" cy="38" r="3.5" fill="rgba(255, 255, 255, 0.3)" />
        <circle cx="60" cy="35" r="2.5" fill="rgba(255, 255, 255, 0.3)" />

        {/* Mushroom Stem */}
        <motion.rect
          x="42"
          y="50"
          width="16"
          height="35"
          rx="8"
          fill="rgba(255, 255, 255, 0.2)"
          className={styles.mushroomStem}
        />

        {/* Glow Effect */}
        <motion.ellipse
          cx="50"
          cy="35"
          rx="38"
          ry="28"
          fill="url(#mushroomGradient)"
          opacity="0.2"
          filter="url(#glow)"
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.svg>
    </motion.div>
  );
});

MushroomMascot.displayName = 'MushroomMascot';

export default MushroomMascot;
