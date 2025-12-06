import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import styles from './CTAButton.module.css';

const CTAButton = memo(({ 
  text = 'Start Building', 
  variant = 'primary', 
  onClick,
  icon: Icon = ArrowRight 
}) => {
  return (
    <motion.button
      className={`${styles.ctaButton} ${styles[`ctaButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17, duration: 0.5 }}
    >
      <span className={styles.ctaButtonText}>{text}</span>
      <motion.div
        className={styles.ctaButtonIcon}
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={20} />
      </motion.div>
      {variant === 'primary' && (
        <motion.div
          className={styles.ctaButtonGlow}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
});

CTAButton.displayName = 'CTAButton';

export default CTAButton;

