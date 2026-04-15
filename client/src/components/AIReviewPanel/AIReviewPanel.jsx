import React from 'react';
import { motion } from 'framer-motion';
import LiveReviewProgress from '../LiveReviewProgress/LiveReviewProgress';
import TrustScoreCard from '../TrustScoreCard/TrustScoreCard';
import CategoryBreakdown from '../CategoryBreakdown/CategoryBreakdown';
import AISummaryCard from '../AISummaryCard/AISummaryCard';
import SuggestionsCard from '../SuggestionsCard/SuggestionsCard';
import StaticAnalysisCard from '../StaticAnalysisCard/StaticAnalysisCard';
import styles from './AIReviewPanel.module.css';

/**
 * AIReviewPanel Component
 * Main container for all AI review results
 * Orchestrates display of score, categories, summary, suggestions, and analysis
 */
const AIReviewPanel = ({ status = 'REVIEWING', progress = 0, review = null, error = null, loading = false }) => {
  // Container variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Show live progress tracker while reviewing
  if (status !== 'REVIEWED' || loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <LiveReviewProgress status={status} progress={progress} error={error} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={styles.panel}
    >
      {/* Review Results */}
      {review && status === 'REVIEWED' && (
        <>
          {/* Trust Score */}
          <motion.div variants={itemVariants}>
            <TrustScoreCard score={review.trustScore} />
          </motion.div>

          {/* Categories Grid */}
          <motion.div variants={itemVariants}>
            <CategoryBreakdown categories={review.categories} />
          </motion.div>

          {/* Summary */}
          {review.summary && (
            <motion.div variants={itemVariants}>
              <AISummaryCard summary={review.summary} />
            </motion.div>
          )}

          {/* Suggestions */}
          {review.suggestions && review.suggestions.length > 0 && (
            <motion.div variants={itemVariants}>
              <SuggestionsCard suggestions={review.suggestions} />
            </motion.div>
          )}

          {/* Static Analysis */}
          {review.staticAnalysis && (
            <motion.div variants={itemVariants}>
              <StaticAnalysisCard analysis={review.staticAnalysis} />
            </motion.div>
          )}
        </>
      )}

      {/* Error State */}
      {error && status === 'ERROR' && (
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-xl bg-red-900/20 border border-red-500/50 backdrop-blur-md"
        >
          <h3 className="text-red-300 font-semibold mb-2">Review Failed</h3>
          <p className="text-red-200 text-sm">{error}</p>
          <p className="text-red-300 text-xs mt-3">
            Please try submitting again or contact support if the issue persists.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIReviewPanel;
