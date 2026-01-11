import { memo } from 'react';
import { GitPullRequest, ExternalLink, ArrowRight, CheckCircle2, Clock, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReviewStatus } from '../../../../hooks/useReviewStatus';
import ReviewStatusIndicator from '../../../../components/ReviewStatusIndicator/ReviewStatusIndicator';
import styles from './SubmissionCard.module.css';

/**
 * SubmissionCard Component
 * Displays submission with review status when submitted
 */
const SubmissionCard = memo(({ submission, onNavigate, fadeInUp }) => {
  const { status: reviewStatus, progress: reviewProgress } = useReviewStatus(submission.id);
  const status = getSubmissionStatus(submission);
  const StatusIcon = status.icon;
  const projectTitle = submission.project?.title || 'Unknown Project';
  const score = submission.score?.totalScore;
  const badgeColor = getBadgeColor(score);

  function getSubmissionStatus(sub) {
    const s = sub.status || 'IN_PROGRESS';
    switch (s) {
      case 'REVIEWED':
        return { label: 'Reviewed', variant: 'reviewed', icon: CheckCircle2 };
      case 'SUBMITTED':
        return { label: 'Under Review', variant: 'submitted', icon: Clock };
      case 'IN_PROGRESS':
        return { label: 'In Progress', variant: 'inProgress', icon: Code };
      default:
        return { label: 'Not Started', variant: 'notStarted', icon: Clock };
    }
  }

  function getBadgeColor(score) {
    if (score === null || score === undefined) return 'muted';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }

  function formatTimeAgo(date) {
    if (!date) return 'Unknown';
    try {
      const now = new Date();
      const past = new Date(date);
      const diffInSeconds = Math.floor((now - past) / 1000);
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return `${Math.floor(diffInSeconds / 604800)}w ago`;
    } catch {
      return 'Unknown';
    }
  }

  return (
    <motion.div variants={fadeInUp}>
      <div
        className={styles.submissionCard}
        onClick={() => onNavigate(`/dashboard/submissions/${submission.id}`)}
      >
        <div className={styles.cardHeader}>
          <div className={styles.projectIcon}>
            <GitPullRequest size={24} />
            {submission.prNumber && (
              <span className={styles.prBadge}>#{submission.prNumber}</span>
            )}
          </div>
          <div className={`${styles.statusBadge} ${styles[status.variant]}`}>
            <StatusIcon size={14} />
            <span>{status.label}</span>
          </div>
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.projectTitle}>{projectTitle}</h3>
          <div className={styles.metaInfo}>
            <span className={styles.timeAgo}>
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
                Repository
              </a>
            )}
          </div>

          {/* Show review progress for submitted submissions */}
          {submission.status === 'SUBMITTED' && (
            <div className={styles.reviewStatus}>
              <ReviewStatusIndicator status={reviewStatus} progress={reviewProgress} />
            </div>
          )}

          {score !== null && score !== undefined && (
            <div className={styles.scoreSection}>
              <div className={styles.scoreLabel}>Total Score</div>
              <div className={styles.scoreRow}>
                <div className={`${styles.scoreValue} ${styles[badgeColor]}`}>
                  {score}/100
                </div>
                {submission.score?.badge && (
                  <div className={`${styles.badge} ${styles[submission.score.badge.toLowerCase()]}`}>
                    {submission.score.badge}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <button className={styles.viewButton}>
            View Details
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

SubmissionCard.displayName = 'SubmissionCard';

export default SubmissionCard;
