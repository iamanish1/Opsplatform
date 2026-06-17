import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, FolderKanban, Award, TrendingUp } from 'lucide-react';
import TrustScoreWidget from '../TrustScoreWidget/TrustScoreWidget';
import LessonsProgressWidget from '../LessonsProgressWidget/LessonsProgressWidget';
import ActiveProjectWidget from '../ActiveProjectWidget/ActiveProjectWidget';
import QuickStatsWidget from '../QuickStatsWidget/QuickStatsWidget';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getSubmissions } from '../../../../services/submissionsApi';
import { getUserPortfolios } from '../../../../services/portfolioApi';
import styles from './DashboardOverview.module.css';

const DashboardOverview = memo(() => {
  const [trustScore, setTrustScore] = useState(0);
  const [stats, setStats] = useState({ submissions: 0, portfolios: 0, certificates: 0 });
  const [loading, setLoading] = useState(true);

  const activeProject = {
    id: '1',
    title: 'Nebula Core',
    progress: 85,
    lastCommit: '25 minutes ago',
    teamMembers: 3,
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [submissions, portfoliosData] = await Promise.allSettled([
        getSubmissions(),
        getUserPortfolios(),
      ]);

      const submissionsArray = submissions.status === 'fulfilled' && Array.isArray(submissions.value)
        ? submissions.value : [];
      const portfoliosArray = portfoliosData.status === 'fulfilled' && Array.isArray(portfoliosData.value)
        ? portfoliosData.value : [];

      const reviewedSubmissions = submissionsArray.filter(s => s.status === 'REVIEWED' && s.score?.totalScore);
      const avgScore = reviewedSubmissions.length > 0
        ? Math.round(reviewedSubmissions.reduce((sum, s) => sum + (s.score?.totalScore || 0), 0) / reviewedSubmissions.length)
        : 0;

      setTrustScore(avgScore);
      setStats({
        submissions: submissionsArray.length,
        portfolios: portfoliosArray.length,
        certificates: reviewedSubmissions.length,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setTrustScore(0);
    } finally {
      setLoading(false);
    }
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
        <motion.div
          className={styles.widgetLarge}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <TrustScoreWidget score={trustScore} />
        </motion.div>

        {/* Lessons Progress Widget */}
        <motion.div
          className={styles.widgetMedium}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <LessonsProgressWidget />
        </motion.div>

        {/* Active Project Widget */}
        <motion.div
          className={styles.widgetLarge}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <ActiveProjectWidget project={activeProject} />
        </motion.div>

        {/* Quick Stats Widget */}
        <motion.div
          className={styles.widgetMedium}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <QuickStatsWidget stats={stats} />
        </motion.div>
      </div>
    </motion.section>
  );
});

DashboardOverview.displayName = 'DashboardOverview';

export default DashboardOverview;
