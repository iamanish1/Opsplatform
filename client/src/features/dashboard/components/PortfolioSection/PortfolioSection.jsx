import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  Share2,
  ExternalLink,
  Linkedin,
  Twitter,
  ArrowRight,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getUserPortfolios } from '../../../../services/portfolioApi';
import styles from './PortfolioSection.module.css';

/**
 * PortfolioSection Component
 * 
 * Displays user portfolios with:
 * - Portfolio cards with scores
 * - Share functionality
 * - Public portfolio links
 * - Project information
 * 
 * @component
 */
const PortfolioSection = memo(() => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  /**
   * Fetch portfolios from API
   */
  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserPortfolios();
      
      const portfoliosArray = Array.isArray(data) ? data : [];
      
      // Sort by updated date (most recent first) and limit to 4 for dashboard
      const sortedPortfolios = portfoliosArray
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .slice(0, 4);
      
      setPortfolios(sortedPortfolios);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError(err.message || 'Failed to load portfolios');
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Format time ago
   */
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

  /**
   * Get portfolio title from portfolio data
   */
  const getPortfolioTitle = useCallback((portfolio) => {
    // Try to get title from portfolioJson
    if (portfolio.portfolioJson?.project?.title) {
      return portfolio.portfolioJson.project.title;
    }
    // Fallback to submission project title
    if (portfolio.submission?.project?.title) {
      return portfolio.submission.project.title;
    }
    // Fallback to summary or default
    return portfolio.summary || 'Portfolio';
  }, []);

  /**
   * Get portfolio score
   */
  const getPortfolioScore = useCallback((portfolio) => {
    if (portfolio.score?.totalScore !== undefined) {
      return portfolio.score.totalScore;
    }
    if (portfolio.portfolioJson?.score?.totalScore !== undefined) {
      return portfolio.portfolioJson.score.totalScore;
    }
    return null;
  }, []);

  /**
   * Get badge color from score
   */
  const getBadgeColor = useCallback((score) => {
    if (score === null || score === undefined) return 'muted';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }, []);

  /**
   * Handle share action
   */
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

  /**
   * Handle copy link
   */
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

  /**
   * Get portfolio badge
   */
  const getPortfolioBadge = useCallback((portfolio) => {
    if (portfolio.score?.badge) {
      return portfolio.score.badge;
    }
    if (portfolio.portfolioJson?.score?.badge) {
      return portfolio.portfolioJson.score.badge;
    }
    return null;
  }, []);

  return (
    <motion.section
      className={styles.portfolioSection}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.sectionHeader}>
        <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
          Portfolio & Certificates
        </motion.h2>
        <motion.button
          onClick={() => navigate('/dashboard/portfolios')}
          className={styles.viewAllButton}
          variants={fadeInUp}
        >
          View All
          <ArrowRight size={16} />
        </motion.button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading portfolios...</span>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchPortfolios} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      ) : portfolios.length === 0 ? (
        <div className={styles.emptyState}>
          <Award size={48} className={styles.emptyIcon} />
          <h3>No portfolios yet</h3>
          <p>Complete and submit projects to generate your portfolios.</p>
        </div>
      ) : (
        <>
          <div className={styles.portfoliosGrid}>
            {portfolios.map((portfolio) => {
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

          {portfolios.length > 0 && (
            <div className={styles.statsFooter}>
              <span className={styles.statsText}>
                {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} available
              </span>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
});

PortfolioSection.displayName = 'PortfolioSection';

export default PortfolioSection;
