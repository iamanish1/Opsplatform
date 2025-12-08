import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  Code,
  ArrowRight,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getSubmissions } from '../../../../services/submissionsApi';
import styles from './SubmissionsSection.module.css';

/**
 * SubmissionsSection Component
 * 
 * Displays recent submissions with:
 * - Submission status and project info
 * - Score indicators
 * - PR tracking
 * - Quick navigation to details
 * 
 * @component
 */
const SubmissionsSection = memo(() => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  /**
   * Fetch submissions from API
   */
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubmissions();
      
      const submissionsArray = Array.isArray(data) ? data : [];
      
      // Sort by updated date (most recent first) and limit to 5 for dashboard
      const sortedSubmissions = submissionsArray
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .slice(0, 5);
      
      setSubmissions(sortedSubmissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get status configuration for a submission
   * @param {Object} submission - Submission object
   * @returns {Object} Status configuration
   */
  const getSubmissionStatus = useCallback((submission) => {
    const status = submission.status || 'IN_PROGRESS';
    
    switch (status) {
      case 'REVIEWED':
        return {
          label: 'Reviewed',
          variant: 'reviewed',
          icon: CheckCircle2,
          color: 'success',
        };
      case 'SUBMITTED':
        return {
          label: 'Under Review',
          variant: 'submitted',
          icon: Clock,
          color: 'warning',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          variant: 'inProgress',
          icon: Code,
          color: 'primary',
        };
      case 'NOT_STARTED':
      default:
        return {
          label: 'Not Started',
          variant: 'notStarted',
          icon: Clock,
          color: 'muted',
        };
    }
  }, []);

  /**
   * Format time ago
   * @param {string|Date} date - Date string or Date object
   * @returns {string} Formatted time ago string
   */
  const formatTimeAgo = useCallback((date) => {
    if (!date) return 'Unknown';
    
    try {
      const now = new Date();
      const past = new Date(date);
      const diffInSeconds = Math.floor((now - past) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    } catch {
      return 'Unknown';
    }
  }, []);

  /**
   * Get badge color from score
   * @param {number} score - Total score
   * @returns {string} Badge color class
   */
  const getBadgeColor = useCallback((score) => {
    if (!score && score !== 0) return 'muted';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }, []);

  /**
   * Handle submission click
   * @param {Object} submission - Submission object
   */
  const handleSubmissionClick = useCallback((submission) => {
    navigate(`/dashboard/submissions/${submission.id}`);
  }, [navigate]);

  const reviewedCount = submissions.filter((s) => s.status === 'REVIEWED').length;
  const totalCount = submissions.length;

  return (
    <motion.section
      className={styles.submissionsSection}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.sectionHeader}>
        <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
          Submissions & PR Tracking
        </motion.h2>
        <motion.button
          onClick={() => navigate('/dashboard/submissions')}
          className={styles.viewAllButton}
          variants={fadeInUp}
        >
          View All
          <ArrowRight size={16} />
        </motion.button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading submissions...</span>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchSubmissions} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      ) : submissions.length === 0 ? (
        <div className={styles.emptyState}>
          <GitPullRequest size={48} className={styles.emptyIcon} />
          <h3>No submissions yet</h3>
          <p>Start a project to create your first submission.</p>
        </div>
      ) : (
        <>
          <GlassCard className={styles.submissionsCard}>
            <div className={styles.submissionsList}>
              {submissions.map((submission, index) => {
                const status = getSubmissionStatus(submission);
                const StatusIcon = status.icon;
                const projectTitle = submission.project?.title || 'Unknown Project';
                const score = submission.score?.totalScore;
                const badgeColor = getBadgeColor(score);

                return (
                  <motion.div
                    key={submission.id}
                    className={styles.submissionItem}
                    variants={fadeInUp}
                    onClick={() => handleSubmissionClick(submission)}
                  >
                    <div className={styles.submissionIcon}>
                      <GitPullRequest size={20} />
                      {submission.prNumber && (
                        <span className={styles.prNumber}>#{submission.prNumber}</span>
                      )}
                    </div>
                    
                    <div className={styles.submissionContent}>
                      <div className={styles.submissionHeader}>
                        <h3 className={styles.submissionTitle}>{projectTitle}</h3>
                        <div className={`${styles.statusBadge} ${styles[status.variant]}`}>
                          <StatusIcon size={14} />
                          <span>{status.label}</span>
                        </div>
                      </div>
                      
                      <div className={styles.submissionMeta}>
                        <span className={styles.submissionTime}>
                          {formatTimeAgo(submission.updatedAt || submission.createdAt)}
                        </span>
                        {submission.repoUrl && (
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.repoLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={14} />
                            View Repo
                          </a>
                        )}
                      </div>
                      
                      {score !== null && score !== undefined && (
                        <div className={styles.scoreContainer}>
                          <div className={styles.scoreLabel}>Score</div>
                          <div className={`${styles.scoreValue} ${styles[badgeColor]}`}>
                            {score}/100
                          </div>
                          {submission.score?.badge && (
                            <div className={`${styles.badge} ${styles[submission.score.badge.toLowerCase()]}`}>
                              {submission.score.badge}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.submissionAction}>
                      <ArrowRight size={20} className={styles.arrowIcon} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
          
          {totalCount > 0 && (
            <div className={styles.statsFooter}>
              <span className={styles.statsText}>
                {reviewedCount} reviewed • {totalCount} total submissions
              </span>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
});

SubmissionsSection.displayName = 'SubmissionsSection';

export default SubmissionsSection;
