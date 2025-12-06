import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import styles from './GlassCard.module.css';

const GlassCard = forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={`${styles.glassCard} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;

