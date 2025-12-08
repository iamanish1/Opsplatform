import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Briefcase, DollarSign, Clock, CheckCircle, TrendingDown, 
  Target, Award, Zap, Shield, TrendingUp, FileCheck 
} from 'lucide-react';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './FloatingCompanyElements.module.css';

const FloatingCompanyElements = memo(() => {
  const prefersReducedMotion = useReducedMotion();

  // Value proposition text elements
  const valueTexts = useMemo(() => [
    { text: 'Verified Talent', delay: 0 },
    { text: 'Save 70% Time', delay: 0.4 },
    { text: 'Reduce Costs', delay: 0.8 },
    { text: 'No OA Rounds', delay: 1.2 },
    { text: 'Industry Ready', delay: 1.6 },
  ], []);

  // Benefit text elements
  const benefitTexts = useMemo(() => [
    { text: 'Direct Hire', delay: 0.2 },
    { text: 'Trust Scores', delay: 0.6 },
    { text: 'Pre-Vetted', delay: 1.0 },
  ], []);

  // Icon elements representing hiring benefits
  const iconElements = useMemo(() => [
    { Icon: Users, delay: 0.3, size: 26, color: '#ec4899' },
    { Icon: Briefcase, delay: 0.7, size: 24, color: '#8b5cf6' },
    { Icon: DollarSign, delay: 1.1, size: 22, color: '#10b981' },
    { Icon: Clock, delay: 1.5, size: 24, color: '#f59e0b' },
    { Icon: CheckCircle, delay: 1.9, size: 26, color: '#10b981' },
    { Icon: TrendingDown, delay: 2.3, size: 24, color: '#10b981' },
    { Icon: Target, delay: 2.7, size: 22, color: '#ec4899' },
    { Icon: Award, delay: 3.1, size: 24, color: '#8b5cf6' },
    { Icon: Shield, delay: 3.5, size: 26, color: '#10b981' },
  ], []);

  // Generate random positions in circular pattern
  const getRandomPosition = (index, total) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 25 + (index % 4) * 12;
    return {
      x: Math.cos(angle) * radius + '%',
      y: Math.sin(angle) * radius + '%',
    };
  };

  const floatingAnimation = prefersReducedMotion ? {} : {
    y: [0, -25, 0],
    opacity: [0.5, 0.7, 0.5],
    rotate: [0, 3, -3, 0]
  };

  return (
    <div className={styles.floatingContainer}>
      {/* Value Proposition Texts */}
      {valueTexts.map((item, index) => {
        const position = getRandomPosition(index, valueTexts.length);
        return (
          <motion.div
            key={`value-${index}`}
            className={styles.valueText}
            style={{
              left: `calc(50% + ${position.x})`,
              top: `calc(50% + ${position.y})`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.6 } : {
              ...floatingAnimation,
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              delay: item.delay,
              duration: 4 + (index % 2),
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <CheckCircle size={12} className={styles.valueIcon} />
            <span className={styles.valueTextContent}>{item.text}</span>
          </motion.div>
        );
      })}

      {/* Benefit Texts */}
      {benefitTexts.map((item, index) => {
        const position = getRandomPosition(index + valueTexts.length, benefitTexts.length);
        return (
          <motion.div
            key={`benefit-${index}`}
            className={styles.benefitText}
            style={{
              left: `calc(50% + ${position.x})`,
              top: `calc(50% + ${position.y})`,
            }}
            initial={{ opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.6 } : {
              ...floatingAnimation,
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              delay: item.delay,
              duration: 5 + (index % 2),
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Shield size={12} className={styles.benefitIcon} />
            <span className={styles.benefitTextContent}>{item.text}</span>
          </motion.div>
        );
      })}

      {/* Icon Elements */}
      {iconElements.map((item, index) => {
        const position = getRandomPosition(
          index + valueTexts.length + benefitTexts.length, 
          iconElements.length
        );
        const Icon = item.Icon;
        return (
          <motion.div
            key={`icon-${index}`}
            className={styles.iconElement}
            style={{
              left: `calc(50% + ${position.x})`,
              top: `calc(50% + ${position.y})`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.6 } : {
              ...floatingAnimation,
              opacity: [0.5, 0.7, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              delay: item.delay,
              duration: 3 + (index % 3),
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Icon 
              size={item.size} 
              className={styles.iconSvg}
              style={{ color: item.color }}
            />
          </motion.div>
        );
      })}
    </div>
  );
});

FloatingCompanyElements.displayName = 'FloatingCompanyElements';

export default FloatingCompanyElements;
