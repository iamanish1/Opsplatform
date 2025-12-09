import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Lock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getLessons } from '../../../../services/lessonsApi';
import styles from './Lessons.module.css';

const Lessons = memo(() => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLessons();
      // Ensure data is an array and sort lessons by order
      const lessonsArray = Array.isArray(data) ? data : [];
      const sortedLessons = lessonsArray.sort((a, b) => a.order - b.order);
      setLessons(sortedLessons);
    } catch (err) {
      setError(err.message || 'Failed to load lessons');
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    // Check if lesson is unlocked (first lesson or previous lesson is completed)
    const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
    const isFirstLesson = lessonIndex === 0;
    const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
    const isUnlocked = isFirstLesson || (previousLesson && previousLesson.completed);

    if (isUnlocked) {
      navigate(`/dashboard/lessons/${lesson.id}`);
    }
  };

  const getLessonStatus = (lesson, index) => {
    if (lesson.completed) {
      return { type: 'completed', label: 'Completed', icon: CheckCircle2 };
    }
    
    const isFirstLesson = index === 0;
    const previousLesson = index > 0 ? lessons[index - 1] : null;
    const isUnlocked = isFirstLesson || (previousLesson && previousLesson.completed);

    if (isUnlocked) {
      return { type: 'available', label: 'Available', icon: BookOpen };
    }
    
    return { type: 'locked', label: 'Locked', icon: Lock };
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading lessons...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchLessons} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.lessonsPage}>
        {/* Header Section */}
        <motion.div
          className={styles.header}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Learning Path</h1>
            <p className={styles.pageSubtitle}>
              Complete lessons sequentially to unlock projects and build your DevOps portfolio
            </p>
          </div>

          {/* Progress Card */}
          <GlassCard className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <div className={styles.progressInfo}>
                <span className={styles.progressLabel}>Overall Progress</span>
                <span className={styles.progressPercentage}>{progressPercentage}%</span>
              </div>
            </div>
            <div className={styles.progressBarContainer}>
              <motion.div
                className={styles.progressBar}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className={styles.progressStats}>
              <div className={styles.statItem}>
                <CheckCircle2 size={16} className={styles.completedIcon} />
                <span>{completedCount} Completed</span>
              </div>
              <div className={styles.statItem}>
                <span>{totalCount - completedCount} Remaining</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Lessons Grid */}
        <motion.div
          className={styles.lessonsContainer}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.lessonsGrid}>
            {lessons.map((lesson, index) => {
              const status = getLessonStatus(lesson, index);
              const StatusIcon = status.icon;
              const isClickable = status.type !== 'locked';

              return (
                <motion.div
                  key={lesson.id}
                  variants={fadeInUp}
                  className={styles.lessonCardWrapper}
                >
                  <GlassCard
                    className={`${styles.lessonCard} ${!isClickable ? styles.locked : ''}`}
                    onClick={() => isClickable && handleLessonClick(lesson)}
                  >
                    {/* Lesson Number Badge */}
                    <div className={styles.lessonNumberBadge}>
                      <span className={styles.lessonNumber}>{lesson.order}</span>
                      {lesson.completed && (
                        <div className={styles.completedBadge}>
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>

                    {/* Lesson Content */}
                    <div className={styles.lessonContent}>
                      <div className={styles.lessonIcon}>
                        <StatusIcon
                          size={32}
                          className={`${styles.icon} ${styles[status.type]}`}
                        />
                      </div>
                      <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                      <div className={styles.lessonStatus}>
                        <span className={`${styles.statusBadge} ${styles[status.type]}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    {isClickable && (
                      <div className={styles.actionArrow}>
                        <ArrowRight size={20} />
                      </div>
                    )}

                    {/* Locked Overlay */}
                    {!isClickable && (
                      <div className={styles.lockedOverlay}>
                        <Lock size={24} />
                        <span>Complete previous lesson to unlock</span>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Completion Message */}
        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            className={styles.completionMessage}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <GlassCard className={styles.completionCard}>
              <CheckCircle2 size={48} className={styles.completionIcon} />
              <h3 className={styles.completionTitle}>Congratulations!</h3>
              <p className={styles.completionText}>
                You've completed all lessons. You can now access the Projects tab to start building
                your portfolio.
              </p>
              <button
                onClick={() => navigate('/dashboard/projects')}
                className={styles.projectsButton}
              >
                Go to Projects
                <ArrowRight size={20} />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
});

Lessons.displayName = 'Lessons';

export default Lessons;
