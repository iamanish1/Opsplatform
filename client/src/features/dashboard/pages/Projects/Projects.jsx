import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Lock,
  CheckCircle2,
  Clock,
  Code,
  Sparkles,
  ArrowRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getProjects } from '../../../../services/projectsApi';
import styles from './Projects.module.css';

/**
 * Projects Page Component
 * 
 * Displays all available DevOps projects with:
 * - Project cards with status, tags, and descriptions
 * - Filtering and sorting capabilities
 * - Progress tracking
 * - Lock/unlock states
 */
const Projects = memo(() => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, available, inProgress, completed

  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Fetch projects from API
   */
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      
      const projectsArray = Array.isArray(data) ? data : [];
      const sortedProjects = projectsArray.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      
      setProjects(sortedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get project status configuration
   */
  const getProjectStatus = useCallback((project) => {
    const isLocked = project.locked || project.submissionStatus === 'LOCKED';
    
    if (isLocked) {
      return {
        label: 'Locked',
        variant: 'locked',
        icon: Lock,
        color: 'muted',
      };
    }
    
    const submissionStatus = project.submissionStatus || project.status;
    
    switch (submissionStatus) {
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
  }, []);

  /**
   * Parse tags from project
   */
  const parseTags = useCallback((project) => {
    if (!project.tags) return [];
    try {
      if (typeof project.tags === 'string') {
        return JSON.parse(project.tags);
      }
      return Array.isArray(project.tags) ? project.tags : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Filter projects based on selected filter
   */
  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    
    const status = getProjectStatus(project);
    const statusMap = {
      available: 'available',
      inProgress: 'inProgress',
      completed: 'completed',
    };
    
    return status.variant === statusMap[filter];
  });

  /**
   * Handle project card click
   */
  const handleProjectClick = useCallback((project) => {
    const isLocked = project.locked || project.submissionStatus === 'LOCKED';
    if (!isLocked) {
      navigate(`/dashboard/projects/${project.id}`);
    }
  }, [navigate]);

  /**
   * Calculate statistics
   */
  const stats = {
    total: projects.length,
    available: projects.filter((p) => {
      const status = getProjectStatus(p);
      return status.variant === 'available';
    }).length,
    inProgress: projects.filter((p) => {
      const status = getProjectStatus(p);
      return status.variant === 'inProgress';
    }).length,
    completed: projects.filter((p) => {
      const status = getProjectStatus(p);
      return status.variant === 'completed';
    }).length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading projects...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchProjects} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.projectsPage}>
        {/* Header Section */}
        <motion.div
          className={styles.header}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>DevOps Projects</h1>
            <p className={styles.pageSubtitle}>
              Build real-world DevOps projects and showcase your skills to potential employers
            </p>
          </div>

          {/* Stats Card */}
          <GlassCard className={styles.statsCard}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Total Projects</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.available}</div>
                <div className={styles.statLabel}>Available</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.inProgress}</div>
                <div className={styles.statLabel}>In Progress</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.completed}</div>
                <div className={styles.statLabel}>Completed</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className={styles.filterTabs}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {[
            { key: 'all', label: 'All Projects' },
            { key: 'available', label: 'Available' },
            { key: 'inProgress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${filter === tab.key ? styles.active : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <GlassCard className={styles.emptyCard}>
              <FolderKanban size={48} className={styles.emptyIcon} />
              <h3>No projects found</h3>
              <p>
                {filter === 'all'
                  ? 'No projects are available yet. Check back soon!'
                  : `No ${filter.replace(/([A-Z])/g, ' $1').toLowerCase()} projects.`}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            className={styles.projectsContainer}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.projectsGrid}>
              {filteredProjects.map((project, index) => {
                const status = getProjectStatus(project);
                const tags = parseTags(project);
                const StatusIcon = status.icon;
                const isLocked = project.locked || project.submissionStatus === 'LOCKED';

                return (
                  <motion.div key={project.id} variants={fadeInUp}>
                    <GlassCard
                      className={`${styles.projectCard} ${isLocked ? styles.locked : ''} ${styles[status.variant]}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      {/* Project Header */}
                      <div className={styles.projectHeader}>
                        <div className={styles.projectIconWrapper}>
                          <div className={styles.projectIcon}>
                            <FolderKanban size={24} />
                          </div>
                          {!isLocked && (
                            <div className={styles.statusIndicator}>
                              <StatusIcon size={14} />
                            </div>
                          )}
                        </div>
                        <div className={`${styles.statusBadge} ${styles[status.variant]}`}>
                          <StatusIcon size={14} />
                          <span>{status.label}</span>
                        </div>
                      </div>

                      {/* Project Content */}
                      <div className={styles.projectContent}>
                        <h3 className={styles.projectTitle}>{project.title}</h3>
                        <p className={styles.projectDescription}>
                          {project.description || 'No description available'}
                        </p>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className={styles.tagsContainer}>
                            {tags.slice(0, 4).map((tag, tagIndex) => (
                              <span key={tagIndex} className={styles.tag}>
                                {tag}
                              </span>
                            ))}
                            {tags.length > 4 && (
                              <span className={styles.tagMore}>+{tags.length - 4}</span>
                            )}
                          </div>
                        )}

                        {/* Progress Indicator */}
                        {!isLocked && project.progress !== undefined && (
                          <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className={styles.progressText}>
                              {project.progress || 0}% Complete
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className={styles.projectFooter}>
                        {isLocked ? (
                          <div className={styles.lockedMessage}>
                            <Lock size={16} />
                            <span>Complete lessons to unlock</span>
                          </div>
                        ) : (
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                          >
                            {status.variant === 'completed' ? 'View Details' : 'Continue'}
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>

                      {/* Starter Repo Link */}
                      {project.starterRepo && !isLocked && (
                        <a
                          href={project.starterRepo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.starterRepoLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                          Starter Repo
                        </a>
                      )}
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

Projects.displayName = 'Projects';

export default Projects;
