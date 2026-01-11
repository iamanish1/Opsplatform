import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './CategoryBreakdown.module.css';

/**
 * CategoryBreakdown Component
 * Displays 10 AI review categories in a grid with scores
 * Categories: Code Quality, Tests, Documentation, Performance, Security, etc.
 */
const CategoryBreakdown = ({ categories = [] }) => {
  // Default categories if not provided
  const defaultCategories = [
    { name: 'Code Quality', score: 0, passed: false },
    { name: 'Tests', score: 0, passed: false },
    { name: 'Documentation', score: 0, passed: false },
    { name: 'Performance', score: 0, passed: false },
    { name: 'Security', score: 0, passed: false },
    { name: 'Error Handling', score: 0, passed: false },
    { name: 'Best Practices', score: 0, passed: false },
    { name: 'Accessibility', score: 0, passed: false },
    { name: 'Maintainability', score: 0, passed: false },
    { name: 'Code Efficiency', score: 0, passed: false },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white">Category Breakdown</h3>
        <p className="text-gray-400 text-sm mt-1">Performance across 10 review categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {displayCategories.map((category, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <div className="p-4 rounded-lg backdrop-blur-md bg-gray-800/30 border border-gray-700/50 hover:border-purple-500/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex-1">{category.name}</h4>
                {category.score >= 70 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
              </div>

              {/* Score */}
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{Math.round(category.score)}</div>
                <div className="text-xs text-gray-500">/100</div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${category.score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${
                    category.score >= 80
                      ? 'bg-green-500'
                      : category.score >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CategoryBreakdown;
