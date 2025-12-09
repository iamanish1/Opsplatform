import { memo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Loader2,
  Check,
  Lock,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getMockLessonDetails, completeMockLesson, getMockLessons } from '../../../../services/mockLessonsData';

// Alias for consistency
const getLessonDetails = getMockLessonDetails;
import styles from './LessonDetail.module.css';

const LessonDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    fetchLessonDetails();
    checkUnlockStatus();
  }, [id]);

  const fetchLessonDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLessonDetails(id);
      setLesson(data);
    } catch (err) {
      setError(err.message || 'Failed to load lesson');
      console.error('Error fetching lesson details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUnlockStatus = async () => {
    try {
      const lessons = await getMockLessons();
      const sortedLessons = lessons.sort((a, b) => a.order - b.order);
      const currentIndex = sortedLessons.findIndex((l) => l.id === id);
      
      if (currentIndex === 0) {
        setIsUnlocked(true);
      } else if (currentIndex > 0) {
        const previousLesson = sortedLessons[currentIndex - 1];
        setIsUnlocked(previousLesson.completed);
      }
    } catch (err) {
      console.error('Error checking unlock status:', err);
    }
  };

  const handleComplete = async () => {
    if (!lesson || lesson.completed) return;

    try {
      setCompleting(true);
      await completeMockLesson(id);
      setLesson({ ...lesson, completed: true });
      
      // Show success message briefly
      setTimeout(() => {
        navigate('/dashboard/lessons');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to complete lesson');
      console.error('Error completing lesson:', err);
    } finally {
      setCompleting(false);
    }
  };

  const formatContent = (content) => {
    // Simple markdown-like formatting
    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, index) => {
      // Check for headers (lines starting with #)
      if (para.startsWith('#')) {
        const level = para.match(/^#+/)[0].length;
        const text = para.replace(/^#+\s*/, '');
        const HeadingTag = `h${Math.min(level, 6)}`;
        return (
          <HeadingTag key={index} className={styles[`heading${level}`]}>
            {text}
          </HeadingTag>
        );
      }
      // Regular paragraph
      return (
        <p key={index} className={styles.paragraph}>
          {para.split('\n').map((line, lineIndex) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < para.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading lesson...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lesson) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error || 'Lesson not found'}</p>
          <button onClick={() => navigate('/dashboard/lessons')} className={styles.backButton}>
            Back to Lessons
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!isUnlocked) {
    return (
      <DashboardLayout>
        <div className={styles.lockedContainer}>
          <GlassCard className={styles.lockedCard}>
            <Lock size={64} className={styles.lockIcon} />
            <h2 className={styles.lockedTitle}>Lesson Locked</h2>
            <p className={styles.lockedMessage}>
              Please complete the previous lesson to unlock this one.
            </p>
            <button onClick={() => navigate('/dashboard/lessons')} className={styles.backButton}>
              <ArrowLeft size={20} />
              Back to Lessons
            </button>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.lessonDetailPage}>
        {/* Header */}
        <motion.div
          className={styles.header}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <button onClick={() => navigate('/dashboard/lessons')} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Lessons
          </button>

          <div className={styles.headerContent}>
            <div className={styles.lessonMeta}>
              <span className={styles.lessonNumber}>Lesson {lesson.order}</span>
              {lesson.completed && (
                <span className={styles.completedBadge}>
                  <CheckCircle2 size={16} />
                  Completed
                </span>
              )}
            </div>
            <h1 className={styles.lessonTitle}>{lesson.title}</h1>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className={styles.content}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <GlassCard className={styles.contentCard}>
            <motion.div variants={fadeInUp} className={styles.lessonContent}>
              <div className={styles.contentBody}>
                {formatContent(lesson.content)}
              </div>
            </motion.div>
          </GlassCard>

          {/* Action Section */}
          {!lesson.completed && (
            <motion.div variants={fadeInUp} className={styles.actionSection}>
              <GlassCard className={styles.actionCard}>
                <div className={styles.actionContent}>
                  <BookOpen size={24} className={styles.actionIcon} />
                  <div className={styles.actionText}>
                    <h3 className={styles.actionTitle}>Ready to Complete?</h3>
                    <p className={styles.actionDescription}>
                      Mark this lesson as complete to unlock the next one.
                    </p>
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className={styles.completeButton}
                  >
                    {completing ? (
                      <>
                        <Loader2 size={20} className={styles.buttonLoader} />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Completion Success */}
          {lesson.completed && (
            <motion.div
              variants={fadeInUp}
              className={styles.completionSection}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <GlassCard className={styles.completionCard}>
                <CheckCircle2 size={48} className={styles.completionIcon} />
                <h3 className={styles.completionTitle}>Lesson Completed!</h3>
                <p className={styles.completionText}>
                  Great job! You can now proceed to the next lesson.
                </p>
                <button
                  onClick={() => navigate('/dashboard/lessons')}
                  className={styles.nextButton}
                >
                  Continue Learning
                </button>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
});

LessonDetail.displayName = 'LessonDetail';

export default LessonDetail;
