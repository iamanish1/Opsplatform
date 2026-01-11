import React from 'react';
import { motion } from 'framer-motion';
import { Code, AlertTriangle } from 'lucide-react';
import styles from './StaticAnalysisCard.module.css';

/**
 * StaticAnalysisCard Component
 * Displays code quality issues found by static analysis
 * Shows: linting errors, code smells, duplications, etc.
 */
const StaticAnalysisCard = ({ analysis = {} }) => {
  const {
    lintingErrors = [],
    codeSmells = [],
    duplications = [],
    complexityIssues = [],
  } = analysis;

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

  const hasIssues =
    (lintingErrors && lintingErrors.length > 0) ||
    (codeSmells && codeSmells.length > 0) ||
    (duplications && duplications.length > 0) ||
    (complexityIssues && complexityIssues.length > 0);

  if (!hasIssues) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full p-6 rounded-xl backdrop-blur-md bg-green-900/20 border border-green-500/50"
      >
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Static Analysis</h3>
            <p className="text-green-300 text-sm">No code quality issues detected!</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full p-6 rounded-xl backdrop-blur-md bg-red-900/20 border border-red-500/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-semibold text-white">Code Quality Issues</h3>
      </div>

      <div className="space-y-4">
        {/* Linting Errors */}
        {lintingErrors && lintingErrors.length > 0 && (
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold text-red-300 mb-2">
              Linting Errors ({lintingErrors.length})
            </h4>
            <div className="space-y-2 ml-2">
              {lintingErrors.map((error, idx) => (
                <p key={idx} className="text-xs text-red-200">
                  • {error}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Code Smells */}
        {codeSmells && codeSmells.length > 0 && (
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold text-amber-300 mb-2">
              Code Smells ({codeSmells.length})
            </h4>
            <div className="space-y-2 ml-2">
              {codeSmells.map((smell, idx) => (
                <p key={idx} className="text-xs text-amber-200">
                  • {smell}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Duplications */}
        {duplications && duplications.length > 0 && (
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold text-blue-300 mb-2">
              Code Duplications ({duplications.length})
            </h4>
            <div className="space-y-2 ml-2">
              {duplications.map((dup, idx) => (
                <p key={idx} className="text-xs text-blue-200">
                  • {dup}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Complexity Issues */}
        {complexityIssues && complexityIssues.length > 0 && (
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold text-orange-300 mb-2">
              Complexity Issues ({complexityIssues.length})
            </h4>
            <div className="space-y-2 ml-2">
              {complexityIssues.map((issue, idx) => (
                <p key={idx} className="text-xs text-orange-200">
                  • {issue}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <p className="text-xs text-red-300 mt-4">
        Fix these issues to improve code quality and maintainability.
      </p>
    </motion.div>
  );
};

export default StaticAnalysisCard;
