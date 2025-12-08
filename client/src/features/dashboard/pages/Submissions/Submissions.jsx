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
  Loader2,
  Filter,
  SortAsc,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getSubmissions } from '../../../../services/submissionsApi';
import styles from './Submissions.module.css';

/**
 * Submissions Page Component
 * 
 * Displays all user submissions with:
 * - Filtering by status
 * - Sorting options
 * - Score indicators
 * - Project information
 */
const Submissions = memo(() => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, inProgress, submitted, reviewed
  const [sortBy, setSortBy] = useState('recent'); // recent, score, project

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubmissions();
      const submissionsArray = Array.isArray(data) ? data : [];
      setSubmissions(submissionsArray);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubmissionStatus = useCallback((submission) => {
    const status = submission.status || 'IN_PROGRESS';
    switch (status) {
      case 'REVIEWED':
        return { label: 'Reviewed', variant: 'reviewed', icon: CheckCircle2 };
      case 'SUBMITTED':
        return { label: 'Under Review', variant: 'submitted', icon: Clock };
      case 'IN_PROGRESS':
        return { label: 'In Progress', variant: 'inProgress', icon: Code };
      default:
        return { label: 'Not Started', variant: 'notStarted', icon: Clock };
    }
  }, []);

  const formatTimeAgo = useCallback((date) => {
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
  }, []);

  const getBadgeColor = useCallback((score) => {
    if (score === null || score === undefined) return 'muted';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }, []);

  // Filter and sort submissions
  const filteredAndSorted = submissions
    .filter((sub) => {
      if (filter === 'all') return true;
      const status = getSubmissionStatus(sub);
      const statusMap = {
        inProgress: 'inProgress',
        submitted: 'submitted',
        reviewed: 'reviewed',
      };
      return status.variant === statusMap[filter];
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          const scoreA = a.score?.totalScore || 0;
          const scoreB = b.score?.totalScore || 0;
          return scoreB - scoreA;
        case 'project':
          const projectA = a.project?.title || '';
          const projectB = b.project?.title || '';
          return projectA.localeCompare(projectB);
        case 'recent':
        default:
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
      }
    });

  const stats = {
    total: submissions.length,
    inProgress: submissions.filter((s) => s.status === 'IN_PROGRESS').length,
    submitted: submissions.filter((s) => s.status === 'SUBMITTED').length,
    reviewed: submissions.filter((s) => s.status === 'REVIEWED').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading submissions...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchSubmissions} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.submissionsPage}>
        <motion.div className={styles.header} variants={fadeInUp} initial="hidden" animate="visible">
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>My Submissions</h1>
            <p className={styles.pageSubtitle}>
              Track your project submissions, scores, and PR reviews
            </p>
          </div>

          <GlassCard className={styles.statsCard}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Total</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.inProgress}</div>
                <div className={styles.statLabel}>In Progress</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.submitted}</div>
                <div className={styles.statLabel}>Under Review</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.reviewed}</div>
                <div className={styles.statLabel}>Reviewed</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div className={styles.controls} variants={fadeInUp} initial="hidden" animate="visible">
          <div className={styles.filterTabs}>
            {[
              { key: 'all', label: 'All' },
              { key: 'inProgress', label: 'In Progress' },
              { key: 'submitted', label: 'Under Review' },
              { key: 'reviewed', label: 'Reviewed' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${filter === tab.key ? styles.active : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.sortContainer}>
            <SortAsc size={16} />
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="score">Highest Score</option>
              <option value="project">Project Name</option>
            </select>
          </div>
        </motion.div>

        {filteredAndSorted.length === 0 ? (
          <motion.div className={styles.emptyState} variants={fadeInUp} initial="hidden" animate="visible">
            <GlassCard className={styles.emptyCard}>
              <GitPullRequest size={48} className={styles.emptyIcon} />
              <h3>No submissions found</h3>
              <p>
                {filter === 'all'
                  ? 'Start a project to create your first submission.'
                  : `No ${filter.replace(/([A-Z])/g, ' $1').toLowerCase()} submissions.`}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            className={styles.submissionsContainer}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.submissionsGrid}>
              {filteredAndSorted.map((submission) => {
                const status = getSubmissionStatus(submission);
                const StatusIcon = status.icon;
                const projectTitle = submission.project?.title || 'Unknown Project';
                const score = submission.score?.totalScore;
                const badgeColor = getBadgeColor(score);

                return (
                  <motion.div key={submission.id} variants={fadeInUp}>
                    <GlassCard
                      className={styles.submissionCard}
                      onClick={() => navigate(`/dashboard/submissions/${submission.id}`)}
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
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
});

Submissions.displayName = 'Submissions';

export default Submissions;
