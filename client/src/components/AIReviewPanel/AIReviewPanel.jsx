import React from 'react';
import { motion } from 'framer-motion';
import LiveReviewProgress from '../LiveReviewProgress/LiveReviewProgress';
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

  // Show live progress tracker while reviewing, or while fetching review data after REVIEWED
  if (status !== 'REVIEWED' || loading || !review) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <LiveReviewProgress status={status} progress={progress} error={error} />
      </motion.div>
    );
  }

  // Only show AI-generated qualitative content — score and categories are already shown
  // above via SubmissionDetail's scoreCard/breakdownCard. If nothing qualitative exists, don't render.
  const hasSummary = review?.summary;
  const hasSuggestions = review?.suggestions?.length > 0;
  const hasStaticAnalysis = review?.staticAnalysis;
  const hasAiContent = hasSummary || hasSuggestions || hasStaticAnalysis;

  if (!hasAiContent && status === 'REVIEWED') {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={styles.panel}
    >
      {/* AI-generated qualitative content only — score/categories shown separately above */}
      {review && status === 'REVIEWED' && (
        <>
          {hasSummary && (
            <motion.div variants={itemVariants}>
              <AISummaryCard summary={review.summary} />
            </motion.div>
          )}

          {hasSuggestions && (
            <motion.div variants={itemVariants}>
              <SuggestionsCard suggestions={review.suggestions} />
            </motion.div>
          )}

          {hasStaticAnalysis && (
            <motion.div variants={itemVariants}>
              <StaticAnalysisCard analysis={review.staticAnalysis} />
            </motion.div>
          )}
        </>
      )}

      {/* Error State */}
      {error && status === 'ERROR' && (
        <motion.div variants={itemVariants} className={styles.errorCard}>
          <h3 className={styles.errorTitle}>Review Failed</h3>
          <p className={styles.errorMsg}>{error}</p>
          <p className={styles.errorHint}>
            Please try submitting again or contact support if the issue persists.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIReviewPanel;
