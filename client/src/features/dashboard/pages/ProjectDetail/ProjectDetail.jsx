import { memo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code,
  Lock,
  Loader2,
  ExternalLink,
  Sparkles,
  FolderKanban,
  Play,
  Check,
  ListChecks,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getProjectDetails, startProject } from '../../../../services/projectsApi';
import styles from './ProjectDetail.module.css';

/**
 * ProjectDetail Page Component
 * 
 * Displays detailed project information including:
 * - Project description and requirements
 * - Task list with progress tracking
 * - Starter repository link
 * - Start/Continue project actions
 * - Submission status
 */
const ProjectDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  /**
   * Fetch project details from API
   */
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectDetails(id);
      setProject(data);
      setIsLocked(data.locked || false);
      
      // If project already started, redirect immediately to submission detail page
      if (data.submissionStatus && data.submissionStatus !== 'NOT_STARTED' && data.submissionId) {
        // Small delay to ensure state is set before navigation
        setTimeout(() => {
          navigate(`/dashboard/submissions/${data.submissionId}`, { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle start project action
   */
  const handleStartProject = async () => {
    if (!project || isLocked) return;

    // Validate repo URL
    if (!repoUrl || !repoUrl.trim()) {
      setError('Please provide a GitHub repository URL');
      return;
    }

    // Validate GitHub URL format
    const trimmedRepoUrl = repoUrl.trim();
    if (!trimmedRepoUrl.startsWith('https://github.com/')) {
      setError('Repository URL must be a valid GitHub URL (e.g., https://github.com/username/repo)');
      return;
    }

    try {
      setStarting(true);
      setError(null);
      const result = await startProject(id, trimmedRepoUrl);
      
      // Redirect to submission detail page after successful start
      if (result && result.submissionId) {
        navigate(`/dashboard/submissions/${result.submissionId}`);
      } else {
        // Fallback: refresh project data if no submissionId in response
        await fetchProjectDetails();
        setRepoUrl('');
      }
    } catch (err) {
      console.error('Error starting project:', err);
      setError(err.message || 'Failed to start project');
    } finally {
      setStarting(false);
    }
  };

  /**
   * Get project status
   */
  const getProjectStatus = () => {
    if (isLocked) {
      return {
        label: 'Locked',
        variant: 'locked',
        icon: Lock,
        color: 'muted',
      };
    }

    const status = project?.submissionStatus || project?.status;
    
    switch (status) {
      case 'REVIEWED':
      case 'COMPLETED':
        return {
          label: 'Completed',
          variant: 'completed',
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
      default:
        return {
          label: 'Available',
          variant: 'available',
          icon: Sparkles,
          color: 'primary',
        };
    }
  };

  /**
   * Parse tasks from project
   */
  const parseTasks = () => {
    if (!project?.tasks || !project.tasksJson) return [];
    
    try {
      const tasks = typeof project.tasksJson === 'string' 
        ? JSON.parse(project.tasksJson) 
        : project.tasksJson;
      return Array.isArray(tasks) ? tasks : [];
    } catch {
      return [];
    }
  };

  /**
   * Parse tags from project
   */
  const parseTags = () => {
    if (!project?.tags) return [];
    try {
      if (typeof project.tags === 'string') {
        return JSON.parse(project.tags);
      }
      return Array.isArray(project.tags) ? project.tags : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading project...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error || 'Project not found'}</p>
          <button onClick={() => navigate('/dashboard/projects')} className={styles.backButton}>
            Back to Projects
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLocked) {
    const status = getProjectStatus();
    const StatusIcon = status.icon;

    return (
      <DashboardLayout>
        <div className={styles.lockedContainer}>
          <GlassCard className={styles.lockedCard}>
            <StatusIcon size={64} className={styles.lockIcon} />
            <h2 className={styles.lockedTitle}>Project Locked</h2>
            <p className={styles.lockedMessage}>
              Complete all lessons to unlock this project and start building your DevOps portfolio.
            </p>
            <button onClick={() => navigate('/dashboard/lessons')} className={styles.lessonsButton}>
              Go to Lessons
            </button>
            <button onClick={() => navigate('/dashboard/projects')} className={styles.backButton}>
              <ArrowLeft size={20} />
              Back to Projects
            </button>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  const status = getProjectStatus();
  const StatusIcon = status.icon;
  const tasks = parseTasks();
  const tags = parseTags();
  const hasStarted = project.submissionStatus && project.submissionStatus !== 'NOT_STARTED';

  return (
    <DashboardLayout>
      <div className={styles.projectDetailPage}>
        {/* Header */}
        <motion.div
          className={styles.header}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <button onClick={() => navigate('/dashboard/projects')} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Projects
          </button>

          <div className={styles.headerContent}>
            <div className={styles.projectMeta}>
              <div className={styles.projectIcon}>
                <FolderKanban size={24} />
              </div>
              <div className={`${styles.statusBadge} ${styles[status.variant]}`}>
                <StatusIcon size={16} />
                <span>{status.label}</span>
              </div>
            </div>
            <h1 className={styles.projectTitle}>{project.title}</h1>
            {tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
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
          {/* Description Card */}
          <motion.div variants={fadeInUp}>
            <GlassCard className={styles.descriptionCard}>
              <h2 className={styles.sectionTitle}>Project Description</h2>
              <div className={styles.descriptionContent}>
                <p>{project.description || 'No description available.'}</p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Tasks Card */}
          {tasks.length > 0 && (
            <motion.div variants={fadeInUp}>
              <GlassCard className={styles.tasksCard}>
                <div className={styles.tasksHeader}>
                  <ListChecks size={24} className={styles.tasksIcon} />
                  <h2 className={styles.sectionTitle}>Project Tasks</h2>
                </div>
                <div className={styles.tasksList}>
                  {tasks.map((task, index) => (
                    <div key={task.id || index} className={styles.taskItem}>
                      <div className={styles.taskNumber}>{index + 1}</div>
                      <div className={styles.taskContent}>
                        <h3 className={styles.taskTitle}>{task.title}</h3>
                        {task.description && (
                          <p className={styles.taskDescription}>{task.description}</p>
                        )}
                        {task.points && (
                          <span className={styles.taskPoints}>{task.points} points</span>
                        )}
                      </div>
                      {task.completed && (
                        <CheckCircle2 size={20} className={styles.taskCompleted} />
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Starter Repo Card */}
          {project.starterRepo && (
            <motion.div variants={fadeInUp}>
              <GlassCard className={styles.starterRepoCard}>
                <div className={styles.starterRepoHeader}>
                  <Code size={24} className={styles.starterRepoIcon} />
                  <h2 className={styles.sectionTitle}>Starter Repository</h2>
                </div>
                <p className={styles.starterRepoDescription}>
                  Get started with the provided repository template.
                </p>
                <a
                  href={project.starterRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.starterRepoLink}
                >
                  <ExternalLink size={20} />
                  Open Starter Repo
                </a>
              </GlassCard>
            </motion.div>
          )}

          {/* Action Section */}
          <motion.div variants={fadeInUp} className={styles.actionSection}>
            <GlassCard className={styles.actionCard}>
              <div className={styles.actionContent}>
                {!hasStarted ? (
                  <>
                    <div className={styles.actionIcon}>
                      <Play size={32} />
                    </div>
                    <div className={styles.actionText}>
                      <h3 className={styles.actionTitle}>Ready to Start?</h3>
                      <p className={styles.actionDescription}>
                        Enter your GitHub repository URL to begin working on this project and build your DevOps portfolio.
                      </p>
                    </div>
                    <div className={styles.repoUrlInputContainer}>
                      <input
                        type="text"
                        placeholder="https://github.com/username/repository"
                        value={repoUrl}
                        onChange={(e) => {
                          setRepoUrl(e.target.value);
                          setError(null);
                        }}
                        className={styles.repoUrlInput}
                        disabled={starting}
                      />
                    </div>
                    {error && (
                      <div className={styles.errorMessage}>
                        {error}
                      </div>
                    )}
                    <button
                      onClick={handleStartProject}
                      disabled={starting || !repoUrl.trim()}
                      className={styles.startButton}
                    >
                      {starting ? (
                        <>
                          <Loader2 size={20} className={styles.buttonLoader} />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Start Project
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.actionIcon}>
                      <Code size={32} />
                    </div>
                    <div className={styles.actionText}>
                      <h3 className={styles.actionTitle}>Continue Working</h3>
                      <p className={styles.actionDescription}>
                        You've already started this project. Continue working on your submission.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/submissions/${project.submissionId}`)}
                      className={styles.continueButton}
                    >
                      <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                      View Submission
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
});

ProjectDetail.displayName = 'ProjectDetail';

export default ProjectDetail;
