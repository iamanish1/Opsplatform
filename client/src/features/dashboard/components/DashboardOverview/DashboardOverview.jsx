import { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, FolderKanban, Award, TrendingUp } from 'lucide-react';
import TrustScoreWidget from '../TrustScoreWidget/TrustScoreWidget';
import LessonsProgressWidget from '../LessonsProgressWidget/LessonsProgressWidget';
import ActiveProjectWidget from '../ActiveProjectWidget/ActiveProjectWidget';
import QuickStatsWidget from '../QuickStatsWidget/QuickStatsWidget';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './DashboardOverview.module.css';

const DashboardOverview = memo(() => {
  // Mock data - will be replaced with API calls
  const trustScore = 88;
  const activeProject = {
    id: '1',
    title: 'Nebula Core',
    progress: 85,
    lastCommit: '25 minutes ago',
    teamMembers: 3,
  };
  const stats = {
    submissions: 5,
    portfolios: 3,
    certificates: 2,
  };

  return (
    <motion.section
      className={styles.overview}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
        Overview
      </motion.h2>

      <div className={styles.widgetsGrid}>
        {/* Trust Score Widget */}
        <motion.div variants={fadeInUp} className={styles.widgetLarge}>
          <TrustScoreWidget score={trustScore} />
        </motion.div>

        {/* Lessons Progress Widget */}
        <motion.div variants={fadeInUp} className={styles.widgetMedium}>
          <LessonsProgressWidget />
        </motion.div>

        {/* Active Project Widget */}
        <motion.div variants={fadeInUp} className={styles.widgetLarge}>
          <ActiveProjectWidget project={activeProject} />
        </motion.div>

        {/* Quick Stats Widget */}
        <motion.div variants={fadeInUp} className={styles.widgetMedium}>
          <QuickStatsWidget stats={stats} />
        </motion.div>
      </div>
    </motion.section>
  );
});

DashboardOverview.displayName = 'DashboardOverview';

export default DashboardOverview;
