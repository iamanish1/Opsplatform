import { memo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code,
  Loader2,
  ExternalLink,
  GitPullRequest,
  TrendingUp,
  Award,
  FileText,
  AlertCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getSubmissionDetails } from '../../../../services/submissionsApi';
import styles from './SubmissionDetail.module.css';

/**
 * SubmissionDetail Page Component
 * 
 * Displays detailed submission information including:
 * - Submission status and project info
 * - Complete score breakdown (10 categories)
 * - PR reviews and feedback
 * - Repository links
 */
const SubmissionDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubmissionDetails(id);
      setSubmission(data);
    } catch (err) {
      console.error('Error fetching submission details:', err);
      setError(err.message || 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (!submission) return null;
    const status = submission.status || 'IN_PROGRESS';
    switch (status) {
      case 'REVIEWED':
        return { label: 'Reviewed', variant: 'reviewed', icon: CheckCircle2, color: 'success' };
      case 'SUBMITTED':
        return { label: 'Under Review', variant: 'submitted', icon: Clock, color: 'warning' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', variant: 'inProgress', icon: Code, color: 'primary' };
      default:
        return { label: 'Not Started', variant: 'notStarted', icon: Clock, color: 'muted' };
    }
  };

  const getBadgeColor = (score) => {
    if (score === null || score === undefined) return 'muted';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const scoreCategories = [
    { key: 'codeQuality', label: 'Code Quality', icon: FileText },
    { key: 'problemSolving', label: 'Problem Solving', icon: TrendingUp },
    { key: 'bugRisk', label: 'Bug Risk', icon: AlertCircle },
    { key: 'devopsExecution', label: 'DevOps Execution', icon: Code },
    { key: 'optimization', label: 'Optimization', icon: TrendingUp },
    { key: 'documentation', label: 'Documentation', icon: FileText },
    { key: 'gitMaturity', label: 'Git Maturity', icon: GitPullRequest },
    { key: 'collaboration', label: 'Collaboration', icon: Code },
    { key: 'deliverySpeed', label: 'Delivery Speed', icon: Clock },
    { key: 'security', label: 'Security', icon: AlertCircle },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading submission...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !submission) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error || 'Submission not found'}</p>
          <button onClick={() => navigate('/dashboard/submissions')} className={styles.backButton}>
            Back to Submissions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const status = getStatusConfig();
  const StatusIcon = status.icon;
  const totalScore = submission.score?.totalScore || 0;
  const badgeColor = getBadgeColor(totalScore);
  const badge = submission.score?.badge || 'RED';

  return (
    <DashboardLayout>
      <div className={styles.submissionDetailPage}>
        {/* Header */}
        <motion.div className={styles.header} variants={fadeInUp} initial="hidden" animate="visible">
          <button onClick={() => navigate('/dashboard/submissions')} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Submissions
          </button>

          <div className={styles.headerContent}>
            <div className={styles.submissionMeta}>
              <div className={styles.submissionIcon}>
                <GitPullRequest size={24} />
                {submission.prNumber && (
                  <span className={styles.prNumber}>#{submission.prNumber}</span>
                )}
              </div>
              <div className={`${styles.statusBadge} ${styles[status.variant]}`}>
                <StatusIcon size={16} />
                <span>{status.label}</span>
              </div>
            </div>
            <h1 className={styles.submissionTitle}>
              {submission.project?.title || 'Submission Details'}
            </h1>
            {submission.repoUrl && (
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoLink}
              >
                <ExternalLink size={16} />
                View Repository
              </a>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className={styles.content}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Score Overview Card */}
          {submission.score && (
            <motion.div variants={fadeInUp}>
              <GlassCard className={styles.scoreCard}>
                <div className={styles.scoreHeader}>
                  <Award size={32} className={styles.scoreIcon} />
                  <div>
                    <h2 className={styles.scoreTitle}>Total Score</h2>
                    <p className={styles.scoreSubtitle}>Overall performance assessment</p>
                  </div>
                </div>
                <div className={styles.scoreDisplay}>
                  <div className={`${styles.totalScore} ${styles[badgeColor]}`}>
                    {totalScore}/100
                  </div>
                  <div className={`${styles.badge} ${styles[badge.toLowerCase()]}`}>
                    {badge} Badge
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Score Breakdown */}
          {submission.score && (
            <motion.div variants={fadeInUp}>
              <GlassCard className={styles.breakdownCard}>
                <h2 className={styles.sectionTitle}>Score Breakdown</h2>
                <div className={styles.categoriesGrid}>
                  {scoreCategories.map((category) => {
                    const score = submission.score[category.key] || 0;
                    const color = getBadgeColor(score);
                    const CategoryIcon = category.icon;

                    return (
                      <div key={category.key} className={styles.categoryItem}>
                        <div className={styles.categoryHeader}>
                          <CategoryIcon size={20} className={styles.categoryIcon} />
                          <span className={styles.categoryLabel}>{category.label}</span>
                        </div>
                        <div className={styles.categoryScore}>
                          <div className={styles.scoreBar}>
                            <div
                              className={`${styles.scoreFill} ${styles[color]}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className={`${styles.scoreValue} ${styles[color]}`}>
                            {score}/10
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Latest Review */}
          {submission.latestReview && (
            <motion.div variants={fadeInUp}>
              <GlassCard className={styles.reviewCard}>
                <h2 className={styles.sectionTitle}>Latest Review</h2>
                <div className={styles.reviewContent}>
                  <div className={styles.reviewScore}>
                    <span className={styles.reviewLabel}>Review Score</span>
                    <div className={`${styles.reviewValue} ${styles[badgeColor]}`}>
                      {submission.latestReview.totalScore || totalScore}/100
                    </div>
                  </div>
                  {submission.latestReview.badge && (
                    <div className={styles.reviewBadge}>
                      <Award size={20} />
                      <span>{submission.latestReview.badge} Badge</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Submission Info */}
          <motion.div variants={fadeInUp}>
            <GlassCard className={styles.infoCard}>
              <h2 className={styles.sectionTitle}>Submission Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  <div className={`${styles.infoValue} ${styles[status.variant]}`}>
                    {status.label}
                  </div>
                </div>
                {submission.prNumber && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>PR Number</span>
                    <span className={styles.infoValue}>#{submission.prNumber}</span>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Created</span>
                  <span className={styles.infoValue}>
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last Updated</span>
                  <span className={styles.infoValue}>
                    {new Date(submission.updatedAt || submission.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
});

SubmissionDetail.displayName = 'SubmissionDetail';

export default SubmissionDetail;
