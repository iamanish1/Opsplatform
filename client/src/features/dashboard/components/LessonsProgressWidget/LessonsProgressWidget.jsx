import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp } from '../../../../utils/animations';
import { getLessons } from '../../../../services/lessonsApi';
import styles from './LessonsProgressWidget.module.css';

const LessonsProgressWidget = memo(() => {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const lessons = await getLessons();
      const lessonsArray = Array.isArray(lessons) ? lessons : [];
      const completedCount = lessonsArray.filter((lesson) => lesson.completed).length;
      setCompleted(completedCount);
      setTotal(lessonsArray.length);
    } catch (err) {
      console.error('Error fetching lesson progress:', err);
      // Set defaults on error
      setCompleted(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <GlassCard className={styles.lessonsWidget}>
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.loader} />
        </div>
      </GlassCard>
    );
  }

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
