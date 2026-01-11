import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';
import styles from './SuggestionsCard.module.css';

/**
 * SuggestionsCard Component
 * Displays improvement suggestions from AI review
 * Each suggestion is actionable and includes context
 */
const SuggestionsCard = ({ suggestions = [] }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full p-6 rounded-xl backdrop-blur-md bg-amber-900/20 border border-amber-500/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Suggestions for Improvement</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="flex gap-3 p-3 rounded-lg bg-gray-800/50 border border-amber-500/20 hover:border-amber-500/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-300 text-sm">{suggestion}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <p className="text-xs text-amber-300 mt-4">
          Implementing these suggestions will improve code quality and maintainability.
        </p>
      )}
    </motion.div>
  );
};

export default SuggestionsCard;
