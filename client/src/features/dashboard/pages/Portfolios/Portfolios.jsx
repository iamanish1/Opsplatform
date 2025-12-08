import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  ExternalLink,
  Linkedin,
  Twitter,
  Copy,
  CheckCircle2,
  Loader2,
  Filter,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getUserPortfolios } from '../../../../services/portfolioApi';
import styles from './Portfolios.module.css';

/**
 * Portfolios Page Component
 * 
 * Displays all user portfolios with:
 * - Portfolio cards with scores and badges
 * - Share functionality
 * - Filtering and sorting
 * - Public portfolio links
 */
const Portfolios = memo(() => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent, score, project

  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserPortfolios();
      const portfoliosArray = Array.isArray(data) ? data : [];
      setPortfolios(portfoliosArray);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError(err.message || 'Failed to load portfolios');
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

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
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    } catch {
      return 'Unknown';
    }
  }, []);

  const getPortfolioTitle = useCallback((portfolio) => {
    if (portfolio.portfolioJson?.project?.title) {
      return portfolio.portfolioJson.project.title;
    }
    if (portfolio.submission?.project?.title) {
      return portfolio.submission.project.title;
    }
    return portfolio.summary || 'Portfolio';
  }, []);

  const getPortfolioScore = useCallback((portfolio) => {
    if (portfolio.score?.totalScore !== undefined) {
      return portfolio.score.totalScore;
    }
    if (portfolio.portfolioJson?.score?.totalScore !== undefined) {
      return portfolio.portfolioJson.score.totalScore;
    }
    return null;
  }, []);

  const getBadgeColor = useCallback((score) => {
    if (score === null || score === undefined) return 'muted';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }, []);

  const getPortfolioBadge = useCallback((portfolio) => {
    if (portfolio.score?.badge) return portfolio.score.badge;
    if (portfolio.portfolioJson?.score?.badge) return portfolio.portfolioJson.score.badge;
    return null;
  }, []);

  const handleShare = useCallback((platform, slug) => {
    const url = `${window.location.origin}/portfolios/${slug}`;
    const text = `Check out my DevOps portfolio with Trust Score!`;
    
    if (platform === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank'
      );
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank'
      );
    }
  }, []);

  const handleCopyLink = useCallback(async (slug) => {
    const url = `${window.location.origin}/portfolios/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, []);

  // Sort portfolios
  const sortedPortfolios = (portfolios && Array.isArray(portfolios) ? [...portfolios] : []).sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const scoreA = getPortfolioScore(a) || 0;
        const scoreB = getPortfolioScore(b) || 0;
        return scoreB - scoreA;
      case 'project':
        const titleA = getPortfolioTitle(a);
        const titleB = getPortfolioTitle(b);
        return titleA.localeCompare(titleB);
      case 'recent':
      default:
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
    }
  });

  const stats = {
    total: portfolios?.length || 0,
    averageScore: portfolios && portfolios.length > 0
      ? Math.round(
          portfolios
            .map((p) => getPortfolioScore(p) || 0)
            .reduce((a, b) => a + b, 0) / portfolios.length
        )
      : 0,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading portfolios...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchPortfolios} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.portfoliosPage}>
        <motion.div className={styles.header} variants={fadeInUp} initial="hidden" animate="visible">
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>My Portfolios</h1>
            <p className={styles.pageSubtitle}>
              Showcase your DevOps projects and achievements with shareable portfolios
            </p>
          </div>

          <GlassCard className={styles.statsCard}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Total Portfolios</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.averageScore}</div>
                <div className={styles.statLabel}>Average Score</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div className={styles.controls} variants={fadeInUp} initial="hidden" animate="visible">
          <div className={styles.sortContainer}>
            <Filter size={16} />
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

        {sortedPortfolios.length === 0 ? (
          <motion.div className={styles.emptyState} variants={fadeInUp} initial="hidden" animate="visible">
            <GlassCard className={styles.emptyCard}>
              <Award size={48} className={styles.emptyIcon} />
              <h3>No portfolios yet</h3>
              <p>Complete and submit projects to generate your portfolios.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            className={styles.portfoliosContainer}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.portfoliosGrid}>
              {sortedPortfolios.map((portfolio) => {
                const title = getPortfolioTitle(portfolio);
                const score = getPortfolioScore(portfolio);
                const badge = getPortfolioBadge(portfolio);
                const badgeColor = getBadgeColor(score);
                const portfolioUrl = `/portfolios/${portfolio.slug}`;

                return (
                  <motion.div key={portfolio.id} variants={fadeInUp}>
                    <GlassCard className={styles.portfolioCard}>
                      <div className={styles.portfolioHeader}>
                        <div className={styles.portfolioIcon}>
                          <Award size={24} />
                        </div>
                        {score !== null && (
                          <div className={styles.portfolioScore}>
                            <span className={`${styles.scoreValue} ${styles[badgeColor]}`}>
                              {score}
                            </span>
                            <span className={styles.scoreLabel}>/100</span>
                            {badge && (
                              <div className={`${styles.badge} ${styles[badge.toLowerCase()]}`}>
                                {badge}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <h3 className={styles.portfolioTitle}>{title}</h3>
                      {portfolio.summary && (
                        <p className={styles.portfolioSummary}>{portfolio.summary}</p>
                      )}
                      <p className={styles.portfolioDate}>
                        Generated {formatTimeAgo(portfolio.createdAt)}
                      </p>

                      <div className={styles.portfolioActions}>
                        <a
                          href={portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewButton}
                        >
                          View Portfolio
                          <ExternalLink size={16} />
                        </a>

                        <div className={styles.shareButtons}>
                          <button
                            className={styles.shareButton}
                            onClick={() => handleCopyLink(portfolio.slug)}
                            aria-label="Copy link"
                            title="Copy link"
                          >
                            {copiedSlug === portfolio.slug ? (
                              <CheckCircle2 size={18} className={styles.copiedIcon} />
                            ) : (
                              <Copy size={18} />
                            )}
                          </button>
                          <button
                            className={styles.shareButton}
                            onClick={() => handleShare('linkedin', portfolio.slug)}
                            aria-label="Share on LinkedIn"
                            title="Share on LinkedIn"
                          >
                            <Linkedin size={18} />
                          </button>
                          <button
                            className={styles.shareButton}
                            onClick={() => handleShare('twitter', portfolio.slug)}
                            aria-label="Share on Twitter"
                            title="Share on Twitter"
                          >
                            <Twitter size={18} />
                          </button>
                        </div>
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

Portfolios.displayName = 'Portfolios';

export default Portfolios;
