import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getLessons } from '../../../../services/lessonsApi';
import styles from './LessonsSection.module.css';

const LessonsSection = memo(() => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const data = await getLessons();
      // Ensure data is an array and sort by order, show first 6
      const lessonsArray = Array.isArray(data) ? data : [];
      const sortedLessons = lessonsArray.sort((a, b) => a.order - b.order).slice(0, 6);
      setLessons(sortedLessons);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      // Fallback to empty array on error
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;

  return (
    <motion.section
      className={styles.lessonsSection}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.sectionHeader}>
        <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
          Lessons Module
        </motion.h2>
        <motion.button
          onClick={() => navigate('/dashboard/lessons')}
          className={styles.viewAllButton}
          variants={fadeInUp}
        >
          View All
          <ArrowRight size={16} />
        </motion.button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading lessons...</div>
      ) : lessons.length === 0 ? (
        <div className={styles.emptyState}>No lessons available</div>
      ) : (
        <>
          <div className={styles.lessonsGrid}>
            {lessons.map((lesson) => (
              <motion.div key={lesson.id} variants={fadeInUp}>
                <GlassCard
                  className={styles.lessonCard}
                  onClick={() => navigate('/dashboard/lessons')}
                >
                  <div className={styles.lessonHeader}>
                    <div className={styles.lessonNumber}>{lesson.order}</div>
                    <div className={styles.lessonIcon}>
                      {lesson.completed ? (
                        <CheckCircle2 size={24} className={styles.completedIcon} />
                      ) : (
                        <BookOpen size={24} />
                      )}
                    </div>
                  </div>
                  <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                  <div className={styles.lessonStatus}>
                    {lesson.completed ? (
                      <span className={styles.statusBadgeSuccess}>Completed</span>
                    ) : (
                      <span className={styles.statusBadgeLocked}>In Progress</span>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          {totalCount > 0 && (
            <div className={styles.progressFooter}>
              <span className={styles.progressText}>
                {completedCount} of {totalCount} lessons completed
              </span>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
});

LessonsSection.displayName = 'LessonsSection';

export default LessonsSection;
