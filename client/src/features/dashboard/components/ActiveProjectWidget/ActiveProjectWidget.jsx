import { memo } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, GitBranch, Users, ArrowRight } from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp } from '../../../../utils/animations';
import styles from './ActiveProjectWidget.module.css';

const ActiveProjectWidget = memo(({ project }) => {
  const { title, progress, lastCommit, teamMembers } = project || {};

  return (
    <GlassCard className={styles.activeProjectWidget}>
      <motion.div
        className={styles.content}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FolderKanban size={24} />
            </div>
            <div className={styles.headerText}>
              <h3 className={styles.title}>Active Project</h3>
              <p className={styles.subtitle}>Current work in progress</p>
            </div>
          </div>
          <button className={styles.viewButton}>
            View <ArrowRight size={16} />
          </button>
        </div>

        {project ? (
          <>
            <div className={styles.projectInfo}>
              <div className={styles.projectTitle}>
                <div className={styles.projectIcon}>
                  <FolderKanban size={20} />
                </div>
                <span>{title}</span>
              </div>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Progress</span>
                <span className={styles.progressPercentage}>{progress}%</span>
              </div>
              
              <div className={styles.progressBarContainer}>
                <motion.div
                  className={styles.progressBar}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.footerItem}>
                <GitBranch size={16} />
                <span>{lastCommit}</span>
              </div>
              <div className={styles.footerItem}>
                <Users size={16} />
                <span>{teamMembers} members</span>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>No active project</p>
            <p className={styles.emptySubtext}>Complete lessons to start a project</p>
          </div>
        )}
      </motion.div>
    </GlassCard>
  );
});

ActiveProjectWidget.displayName = 'ActiveProjectWidget';

export default ActiveProjectWidget;
