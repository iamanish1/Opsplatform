import { motion } from 'framer-motion';
import styles from './SectionDivider.module.css';

const SectionDivider = ({ variant = 'default' }) => {
  return (
    <motion.div
      className={`${styles.divider} ${styles[variant]}`}
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.dividerLine}></div>
      <div className={styles.dividerGradient}></div>
    </motion.div>
  );
};

export default SectionDivider;

