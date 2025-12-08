import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getProjects } from '../../../../services/projectsApi';
import styles from './ProjectsSection.module.css';

/**
 * ProjectsSection Component
 * 
 * Displays a grid of DevOps projects with:
 * - Project cards with tags, status, and descriptions
 * - Lock/unlock states based on user eligibility
 * - Submission status tracking
 * - Modern, responsive design
 * 
 * @component
 */
const ProjectsSection = memo(() => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Fetch projects from API
   * Handles errors gracefully with fallback to empty state
   */
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      
      // Ensure data is an array
      const projectsArray = Array.isArray(data) ? data : [];
      
      // Sort by creation date (newest first) and limit to 6 for dashboard
      const sortedProjects = projectsArray
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6);
      
      setProjects(sortedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
      // Fallback to empty array on error
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get status badge configuration for a project
   * @param {Object} project - Project object
   * @returns {Object} Status configuration
   */
  const getProjectStatus = useCallback((project) => {
    // Check if project is locked (user hasn't completed prerequisites)
    const isLocked = project.locked || project.submissionStatus === 'LOCKED';
    
    // Check submission status
    const submissionStatus = project.submissionStatus || project.status;
    
    if (isLocked) {
      return {
        label: 'Locked',
        variant: 'locked',
        icon: Lock,
        color: 'muted',
      };
    }
    
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
      case 'NOT_STARTED':
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
   * Handle project card click
   * @param {Object} project - Project object
   */
  const handleProjectClick = useCallback((project) => {
    if (project.locked || project.submissionStatus === 'LOCKED') {
      return; // Don't navigate if locked
    }
    
    // Navigate to project detail page
    // TODO: Create project detail page route
    navigate(`/dashboard/projects/${project.id}`);
  }, [navigate]);

  /**
   * Handle start project action
   * @param {Event} e - Click event
   * @param {Object} project - Project object
   */
  const handleStartProject = useCallback((e, project) => {
    e.stopPropagation(); // Prevent card click
    
    if (project.locked || project.submissionStatus === 'LOCKED') {
      return;
    }
    
    // Navigate to project detail page where user can start the project
    navigate(`/dashboard/projects/${project.id}`);
  }, [navigate]);

  /**
   * Parse tags from project
   * @param {Object} project - Project object
   * @returns {Array} Array of tag strings
   */
  const parseTags = useCallback((project) => {
    if (!project.tags) return [];
    
    try {
      // Handle both JSON string and array
      if (typeof project.tags === 'string') {
        return JSON.parse(project.tags);
      }
      return Array.isArray(project.tags) ? project.tags : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Render project card
   * @param {Object} project - Project object
   * @param {number} index - Card index for animation
   */
  const renderProjectCard = useCallback((project, index) => {
    const status = getProjectStatus(project);
    const tags = parseTags(project);
    const StatusIcon = status.icon;
    const isLocked = project.locked || project.submissionStatus === 'LOCKED';
    const hasSubmission = project.submissionStatus && project.submissionStatus !== 'NOT_STARTED' && !isLocked;

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
              {hasSubmission && (
                <div className={styles.statusIndicator}>
                  <StatusIcon size={14} />
                </div>
              )}
            </div>
            
            {/* Status Badge */}
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
                {tags.slice(0, 3).map((tag, tagIndex) => (
                  <span key={tagIndex} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className={styles.tagMore}>+{tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Progress Indicator (if in progress) */}
            {hasSubmission && project.progress !== undefined && (
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
            ) : hasSubmission ? (
              <button
                className={styles.actionButton}
                onClick={(e) => handleProjectClick(project)}
              >
                {status.variant === 'completed' ? 'View Details' : 'Continue'}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className={styles.startButton}
                onClick={(e) => handleStartProject(e, project)}
              >
                <Sparkles size={16} />
                Start Project
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          {/* Starter Repo Link (if available) */}
          {project.starterRepo && !isLocked && (
            <a
              href={project.starterRepo}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.starterRepoLink}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              View Starter Repo
            </a>
          )}
        </GlassCard>
      </motion.div>
    );
  }, [getProjectStatus, parseTags, handleProjectClick, handleStartProject]);

  return (
    <motion.section
      className={styles.projectsSection}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.sectionHeader}>
        <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
          Projects Module
        </motion.h2>
        <motion.button
          onClick={() => navigate('/dashboard/projects')}
          className={styles.viewAllButton}
          variants={fadeInUp}
        >
          View All
          <ArrowRight size={16} />
        </motion.button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading projects...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchProjects} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className={styles.emptyState}>
          <FolderKanban size={48} className={styles.emptyIcon} />
          <h3>No projects available</h3>
          <p>Projects will appear here once they're added to the platform.</p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && projects.length > 0 && (
        <>
          <div className={styles.projectsGrid}>
            {projects.map((project, index) => renderProjectCard(project, index))}
          </div>
          
          {/* Stats Footer */}
          <div className={styles.statsFooter}>
            <span className={styles.statsText}>
              {projects.filter((p) => !p.locked && p.submissionStatus === 'REVIEWED').length} completed •{' '}
              {projects.filter((p) => !p.locked && p.submissionStatus === 'IN_PROGRESS').length} in progress •{' '}
              {projects.length} total projects
            </span>
          </div>
        </>
      )}
    </motion.section>
  );
});

ProjectsSection.displayName = 'ProjectsSection';

export default ProjectsSection;
