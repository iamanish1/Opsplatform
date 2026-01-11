import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import styles from './ReviewStatusIndicator.module.css';  

/**
 * ReviewStatusIndicator Component
 * Shows the current status and progress of code review
 * Displays: REVIEWING (progress bar), REVIEWED (success), ERROR (error message)
 */
const ReviewStatusIndicator = ({ status = 'REVIEWING', progress = 0, error = null }) => {
  const statusConfig = {
    REVIEWING: {
      icon: Clock,
      label: 'Review in Progress',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/50',
    },
    REVIEWED: {
      icon: CheckCircle2,
      label: 'Review Complete',
      color: 'text-green-400',
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-500/50',
    },
    ERROR: {
      icon: AlertCircle,
      label: 'Review Failed',
      color: 'text-red-400',
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-500/50',
    },
  };

  const config = statusConfig[status] || statusConfig.REVIEWING;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full p-6 rounded-xl backdrop-blur-md ${config.bgColor} border ${config.borderColor}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <Icon className={`w-6 h-6 ${config.color}`} />
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
      </div>

      {status === 'REVIEWING' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
        </div>
      )}

      {status === 'ERROR' && error && (
        <p className="text-sm text-red-300">{error}</p>
      )}
    </motion.div>
  );
};

export default ReviewStatusIndicator;
