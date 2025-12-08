import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp } from '../../../../utils/animations';
import styles from './LessonsProgressWidget.module.css';

const LessonsProgressWidget = memo(({ completed = 8, total = 12 }) => {
  const percentage = Math.round((completed / total) * 100);

  return (
    <GlassCard className={styles.lessonsWidget}>
      <motion.div
        className={styles.content}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <BookOpen size={24} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Lessons</h3>
            <p className={styles.subtitle}>Complete to unlock projects</p>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Progress</span>
            <span className={styles.progressPercentage}>{percentage}%</span>
          </div>
          
          <div className={styles.progressBarContainer}>
            <motion.div
              className={styles.progressBar}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className={styles.progressStats}>
            <div className={styles.statItem}>
              <CheckCircle2 size={16} className={styles.completedIcon} />
              <span>{completed} Completed</span>
            </div>
            <div className={styles.statItem}>
              <span>{total - completed} Remaining</span>
            </div>
          </div>
        </div>

        {completed === total && (
          <motion.div
            className={styles.completedBadge}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <CheckCircle2 size={16} />
            <span>All lessons completed!</span>
          </motion.div>
        )}
      </motion.div>
    </GlassCard>
  );
});

LessonsProgressWidget.displayName = 'LessonsProgressWidget';

export default LessonsProgressWidget;
