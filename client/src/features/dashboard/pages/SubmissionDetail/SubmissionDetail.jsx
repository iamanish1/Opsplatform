import { memo, useState, useEffect, useCallback } from 'react';
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
  ListChecks,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import AIReviewPanel from '../../../../components/AIReviewPanel/AIReviewPanel';
import ProofCard from '../../../../components/ProofCard/ProofCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getSubmissionDetails, submitForReview, fetchAndAttachPR, updateSubmissionRepoUrl } from '../../../../services/submissionsApi';
import { getSubmissionTasks, updateTaskStatus } from '../../../../services/taskProgressApi';
import { useReviewStatus } from '../../../../hooks/useReviewStatus';
import { useReviewCache } from '../../../../hooks/useReviewCache';
import { useToast } from '../../../../contexts/ToastContext';
import { useAuth } from '../../../../contexts/AuthContext';
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
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingPR, setFetchingPR] = useState(false);
  const [prFetchError, setPrFetchError] = useState(null);
  const [prFetchAttempted, setPrFetchAttempted] = useState(false);
  const [editingRepoUrl, setEditingRepoUrl] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [savingRepoUrl, setSavingRepoUrl] = useState(false);

  // AI Review hooks
  const { status: reviewStatus, progress: reviewProgress, review, loading: reviewLoading, error: reviewError } = useReviewStatus(id);
  const { cache: cachedReview, clearCache } = useReviewCache(id);
  const toast = useToast();
  const { user: authUser } = useAuth();
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const fetchSubmissionDetails = useCallback(async () => {
    if (!id) {
      setError('Submission ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching submission details for ID:', id);
      const data = await getSubmissionDetails(id);
      console.log('Submission data received:', data);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid submission data received');
      }
      
      setSubmission(data);
    } catch (err) {
      console.error('Error fetching submission details:', err);
      const errorMessage = err.message || 'Failed to load submission';
      setError(errorMessage);
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    if (!id) {
      setLoadingTasks(false);
      return;
    }

    try {
      setLoadingTasks(true);
      console.log('Fetching tasks for submission ID:', id);
      const data = await getSubmissionTasks(id);
      console.log('Tasks data received:', data);
      
      const tasksArray = Array.isArray(data?.tasks) ? data.tasks : [];
      setTasks(tasksArray);
      
      // Handle progress - backend returns progress as an object with completed, total, percentage
      if (data?.progress && typeof data.progress === 'object' && !Array.isArray(data.progress)) {
        // Backend returns progress as an object: { completed, total, percentage }
        setProgress({
          completed: Number(data.progress.completed) || 0,
          total: Number(data.progress.total) || 0,
          percentage: Number(data.progress.percentage) || 0,
        });
      } else {
        // Fallback: calculate from tasks if progress object not available
        const completed = tasksArray.filter(t => t.completed === true).length;
        const total = tasksArray.length;
        setProgress({
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      // Reset to safe defaults on error
      setTasks([]);
      setProgress({ completed: 0, total: 0, percentage: 0 });
    } finally {
      setLoadingTasks(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmissionDetails();
    fetchTasks();
  }, [id, fetchSubmissionDetails, fetchTasks]);

  const handleTaskToggle = useCallback(async (taskId, currentStatus) => {
    const newStatus = !currentStatus;
    
    // Optimistic update for tasks
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: newStatus, completedAt: newStatus ? new Date() : null }
          : task
      )
    );

    // Optimistic update for progress
    setProgress((prevProgress) => {
      const newCompleted = newStatus 
        ? prevProgress.completed + 1 
        : prevProgress.completed - 1;
      const total = prevProgress.total;
      return {
        completed: newCompleted,
        total,
        percentage: total > 0 ? Math.round((newCompleted / total) * 100) : 0,
      };
    });

    setUpdatingTask(taskId);

    try {
      await updateTaskStatus(id, taskId, newStatus);
      // Success - optimistic update already applied, no need to update again
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert optimistic update for tasks
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: currentStatus, completedAt: null }
            : task
        )
      );
      // Revert optimistic update for progress
      setProgress((prevProgress) => {
        const revertedCompleted = currentStatus 
          ? prevProgress.completed + 1 
          : prevProgress.completed - 1;
        const total = prevProgress.total;
        return {
          completed: revertedCompleted,
          total,
          percentage: total > 0 ? Math.round((revertedCompleted / total) * 100) : 0,
        };
      });
      toast.error('Failed to update task. Please try again.');
    } finally {
      setUpdatingTask(null);
    }
  }, [id]);

  const handleSubmitForReview = useCallback(async () => {
    const completedCount = progress.completed || 0;
    const totalCount = progress.total || 0;

    if (completedCount !== totalCount || totalCount === 0) {
      toast.warning('Please complete all tasks before submitting for review.');
      return;
    }

    // Show inline confirm instead of window.confirm
    setConfirmSubmit(true);
  }, [progress.completed, progress.total, toast]);

  const handleConfirmedSubmit = useCallback(async () => {
    setConfirmSubmit(false);
    try {
      setSubmitting(true);
      setPrFetchError(null);
      const result = await submitForReview(id);

      if (result.submission) {
        setSubmission(prev => ({
          ...prev,
          status: result.submission.status,
          prNumber: result.submission.prNumber,
        }));
        setPrFetchAttempted(true);
      }

      await fetchSubmissionDetails();
      clearCache();

      const msg = result.submission?.prAttached
        ? `Submitted! PR #${result.submission.prNumber} detected and attached.`
        : result.message || 'Project submitted for review successfully!';
      toast.success(msg);
    } catch (err) {
      toast.error(err.message || 'Failed to submit project for review');
    } finally {
      setSubmitting(false);
    }
  }, [id, fetchSubmissionDetails, clearCache, toast]);

  const handleFetchPR = useCallback(async () => {
    try {
      setFetchingPR(true);
      setPrFetchError(null);
      const result = await fetchAndAttachPR(id);

      setSubmission(prev => ({ ...prev, prNumber: result.submission.prNumber }));
      await fetchSubmissionDetails();
      setPrFetchAttempted(true);
      toast.success(result.message || `PR #${result.submission.prNumber} successfully attached!`);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch PR information';
      setPrFetchError(errorMessage);
      setPrFetchAttempted(true);
      toast.error(errorMessage);
    } finally {
      setFetchingPR(false);
    }
  }, [id, fetchSubmissionDetails, toast]);

  const handleSaveRepoUrl = useCallback(async () => {
    if (!newRepoUrl.trim().startsWith('https://github.com/')) {
      toast.error('Must be a valid GitHub URL starting with https://github.com/');
      return;
    }
    try {
      setSavingRepoUrl(true);
      await updateSubmissionRepoUrl(id, newRepoUrl.trim());
      await fetchSubmissionDetails();
      setEditingRepoUrl(false);
      setPrFetchError(null);
      setPrFetchAttempted(false);
      toast.success('Repository URL updated. You can now retry fetching the PR.');
    } catch (err) {
      toast.error(err.message || 'Failed to update repository URL');
    } finally {
      setSavingRepoUrl(false);
    }
  }, [id, newRepoUrl, fetchSubmissionDetails, toast]);

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
            {submission.status === 'IN_PROGRESS' && (
              <p className={styles.headerSubtitle}>
                Work through the tasks below. Mark each task as complete as you finish implementing it.
              </p>
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
          {/* Task Progress Card */}
          <motion.div variants={fadeInUp}>
            <GlassCard className={styles.tasksCard}>
                <div className={styles.tasksHeader}>
                  <ListChecks size={24} className={styles.tasksIcon} />
                  <div className={styles.tasksHeaderContent}>
                    <h2 className={styles.sectionTitle}>Project Tasks</h2>
                    <p className={styles.tasksSubtitle}>
                      {loadingTasks 
                        ? 'Loading tasks...' 
                        : tasks.length > 0 
                          ? `${progress.completed} of ${progress.total} tasks completed`
                          : 'No tasks available'}
                    </p>
                  </div>
                </div>
                
                {loadingTasks ? (
                  <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.loader} />
                    <p>Loading tasks...</p>
                  </div>
                ) : tasks.length > 0 ? (
                  <>
                    {/* Progress Bar */}
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBar}>
                        <motion.div
                          className={styles.progressFill}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentage}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className={styles.progressPercentage}>{progress.percentage}%</span>
                    </div>

                    {/* Tasks List */}
                    <div className={styles.tasksList}>
                      {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}
                    >
                      <div className={styles.taskCheckbox}>
                        <button
                          onClick={() => handleTaskToggle(task.id, task.completed)}
                          disabled={updatingTask === task.id}
                          className={styles.checkboxButton}
                          aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                        >
                          {updatingTask === task.id ? (
                            <Loader2 size={20} className={styles.checkboxLoader} />
                          ) : task.completed ? (
                            <CheckCircle2 size={20} className={styles.checkboxIcon} />
                          ) : (
                            <div className={styles.checkboxEmpty} />
                          )}
                        </button>
                      </div>
                      <div className={styles.taskContent}>
                        <div className={styles.taskHeader}>
                          <span className={styles.taskNumber}>Task {index + 1}</span>
                          {task.points > 0 && (
                            <span className={styles.taskPoints}>{task.points} points</span>
                          )}
                        </div>
                        <h3 className={styles.taskTitle}>{task.title}</h3>
                        {task.description && (
                          <p className={styles.taskDescription}>{task.description}</p>
                        )}
                        {task.completed && task.completedAt && (
                          <span className={styles.taskCompletedAt}>
                            Completed {new Date(task.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.noTasksMessage}>
                    <p>No tasks have been defined for this project yet.</p>
                    <p className={styles.noTasksSubtext}>
                      Tasks will appear here once they are configured for this project.
                    </p>
                  </div>
                )}

                {/* Submit for Review Button */}
                {submission.status === 'IN_PROGRESS' && (
                  <div className={styles.submitSection}>
                    <div className={styles.submitInfo}>
                      <p className={styles.submitMessage}>
                        {progress.completed === progress.total && progress.total > 0
                          ? 'All tasks completed! Ready to submit for review.'
                          : `Complete ${progress.total - progress.completed} more task${progress.total - progress.completed === 1 ? '' : 's'} to submit for review.`}
                      </p>
                    </div>

                    {/* Inline confirm banner */}
                    {confirmSubmit && (
                      <div className={styles.confirmBanner}>
                        <p className={styles.confirmText}>Make sure your code is pushed to GitHub before submitting.</p>
                        <div className={styles.confirmActions}>
                          <button className={styles.confirmCancelBtn} onClick={() => setConfirmSubmit(false)}>Cancel</button>
                          <button className={styles.confirmOkBtn} onClick={handleConfirmedSubmit}>
                            <CheckCircle2 size={16} /> Yes, Submit Now
                          </button>
                        </div>
                      </div>
                    )}

                    {!confirmSubmit && (
                      <button
                        onClick={handleSubmitForReview}
                        disabled={submitting || progress.completed !== progress.total || progress.total === 0}
                        className={styles.submitButton}
                      >
                        {submitting ? (
                          <><Loader2 size={20} className={styles.buttonLoader} />Submitting...</>
                        ) : (
                          <><CheckCircle2 size={20} />Submit for Review</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Submitted Status Message */}
                {submission.status === 'SUBMITTED' && (
                  <div className={styles.submittedMessage}>
                    <Clock size={24} className={styles.submittedIcon} />
                    <div style={{ width: '100%' }}>
                      <h3 className={styles.submittedTitle}>Project Submitted for Review</h3>
                      <p className={styles.submittedText}>
                        Your project is currently being reviewed by our AI engine. You'll receive a notification once the review is complete.
                      </p>
                      
                      {/* PR Status Section */}
                      {submission.prNumber && (
                        <div className={styles.prSuccessContainer}>
                          <CheckCircle2 size={18} className={styles.prSuccessIcon} />
                          <span className={styles.prSuccessText}>
                            PR #{submission.prNumber} successfully attached
                          </span>
                        </div>
                      )}
                      
                      {!submission.prNumber && (
                        <div className={styles.prActionContainer}>
                          {!prFetchAttempted && (
                            <div className={styles.prAutoFetchingContainer}>
                              <Loader2 size={18} className={styles.prFetchingSpinner} />
                              <span className={styles.prAutoFetchingText}>
                                Automatically detecting PR from your repository...
                              </span>
                            </div>
                          )}

                          {prFetchAttempted && (
                            <>
                              {/* Current repo URL + edit */}
                              <div className={styles.repoUrlRow}>
                                <span className={styles.repoUrlLabel}>Repo:</span>
                                {editingRepoUrl ? (
                                  <div className={styles.repoUrlEditGroup}>
                                    <input
                                      className={styles.repoUrlEditInput}
                                      value={newRepoUrl}
                                      onChange={e => setNewRepoUrl(e.target.value)}
                                      placeholder="https://github.com/username/repo"
                                      disabled={savingRepoUrl}
                                    />
                                    <button className={styles.repoUrlSaveBtn} onClick={handleSaveRepoUrl} disabled={savingRepoUrl}>
                                      {savingRepoUrl ? <Loader2 size={14} className={styles.buttonLoader} /> : 'Save'}
                                    </button>
                                    <button className={styles.repoUrlCancelBtn} onClick={() => setEditingRepoUrl(false)} disabled={savingRepoUrl}>Cancel</button>
                                  </div>
                                ) : (
                                  <div className={styles.repoUrlDisplay}>
                                    <code className={styles.repoUrlCode}>{submission.repoUrl || 'No repo URL'}</code>
                                    <button
                                      className={styles.repoUrlEditBtn}
                                      onClick={() => { setEditingRepoUrl(true); setNewRepoUrl(submission.repoUrl || ''); }}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Error + guide */}
                              {prFetchError && (
                                <div className={styles.prGuide}>
                                  <p className={styles.prGuideTitle}><AlertCircle size={15} /> No open PRs found in this repo. Follow these steps:</p>
                                  <ol className={styles.prGuideSteps}>
                                    <li>Push your code to the repo above</li>
                                    <li>On GitHub, go to your repo → click <strong>Pull requests</strong> → <strong>New pull request</strong></li>
                                    <li>Select your branch → click <strong>Create pull request</strong></li>
                                    <li>Leave the PR <strong>open</strong> (do not merge)</li>
                                    <li>Click <strong>Retry: Fetch PR</strong> below</li>
                                  </ol>
                                  <a
                                    href={submission.repoUrl ? `${submission.repoUrl}/pulls` : 'https://github.com'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.prGuideLink}
                                  >
                                    <ExternalLink size={13} /> Open PRs on GitHub
                                  </a>
                                </div>
                              )}

                              <button
                                onClick={handleFetchPR}
                                disabled={fetchingPR}
                                className={styles.fetchPRButton}
                              >
                                {fetchingPR ? (
                                  <><Loader2 size={18} className={styles.buttonLoader} />Retrying...</>
                                ) : (
                                  <><GitPullRequest size={18} />Retry: Fetch PR</>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>

          {/* AI Review Panel - Show when submission is submitted or reviewed */}
          {(submission.status === 'SUBMITTED' || submission.status === 'REVIEWED') && (
            <motion.div variants={fadeInUp}>
              <AIReviewPanel
                status={reviewStatus}
                progress={reviewProgress}
                review={review || cachedReview}
                error={reviewError}
                loading={reviewLoading}
              />
            </motion.div>
          )}

          {/* Score Overview Card - Only show when REVIEWED */}
          {submission.status === 'REVIEWED' && submission.score && (
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

          {/* Score Breakdown - Only show when REVIEWED */}
          {submission.status === 'REVIEWED' && submission.score && (
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

          {/* Latest Review - Only show when REVIEWED */}
          {submission.status === 'REVIEWED' && submission.latestReview && (
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

          {/* Proof Card — share your achievement */}
          {submission.status === 'REVIEWED' && submission.score && submission.portfolio?.slug && (
            <motion.div variants={fadeInUp}>
              <GlassCard className={styles.reviewCard}>
                <h2 className={styles.sectionTitle}>Share Your Achievement</h2>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>
                  Share your AI-verified Trust Score with recruiters and on social media.
                </p>
                <ProofCard
                  user={{ name: authUser?.name, githubUsername: authUser?.githubUsername, avatar: authUser?.avatar }}
                  score={submission.score}
                  portfolioSlug={submission.portfolio.slug}
                  compact
                />
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
