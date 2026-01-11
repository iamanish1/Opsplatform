import React from 'react';
import { motion } from 'framer-motion';
import styles from './TrustScoreCard.module.css';

/**
 * TrustScoreCard Component
 * Displays the main trust score in an animated circular progress
 * Color-coded: Green (80+), Amber (60-79), Red (<60)
 */
const TrustScoreCard = ({ score = 0 }) => {
  // Determine color based on score
  const getScoreColor = (s) => {
    if (s >= 80) return { text: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-500/50' };
    if (s >= 60) return { text: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-500/50' };
    return { text: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/50' };
  };

  const scoreColor = getScoreColor(score);

  const getScoreBadge = (s) => {
    if (s >= 80) return { label: 'Excellent', color: 'text-green-300' };
    if (s >= 60) return { label: 'Good', color: 'text-amber-300' };
    return { label: 'Needs Improvement', color: 'text-red-300' };
  };

  const badge = getScoreBadge(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`w-full p-8 rounded-xl backdrop-blur-md ${scoreColor.bg} border ${scoreColor.border}`}
    >
      <div className="text-center">
        {/* Circular Progress */}
        <div className="relative flex justify-center mb-6">
          <svg className="w-32 h-32" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 50}`}
              initial={{ strokeDashoffset: `${2 * Math.PI * 50}` }}
              animate={{ strokeDashoffset: `${2 * Math.PI * 50 * (1 - score / 100)}` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score text in center */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className={`text-5xl font-bold ${scoreColor.text}`}>{Math.round(score)}</div>
              <div className="text-xs text-gray-400 mt-1">/100</div>
            </motion.div>
          </div>
        </div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`inline-block px-4 py-2 rounded-full bg-gray-700/50 border border-gray-600 ${badge.color} font-semibold text-sm`}
        >
          {badge.label}
        </motion.div>

        {/* Score interpretation */}
        <p className="text-gray-300 text-sm mt-4">
          {score >= 80
            ? 'Your code meets high quality standards'
            : score >= 60
            ? 'Your code has good quality with some improvements needed'
            : 'Your code needs significant improvements'}
        </p>
      </div>
    </motion.div>
  );
};

export default TrustScoreCard;
