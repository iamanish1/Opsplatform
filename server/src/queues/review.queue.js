const { Queue } = require('bullmq');
const redis = require('../config/redis');

// Create review queue
// Concurrency: 1 (dev), 3 (production) - configured in worker
const reviewQueue = new Queue('reviewQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5, // Retry up to 5 times for GitHub API timeouts, LLM failures, network failures
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay, exponential backoff
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

// Log queue events for debugging
// Suppress connection errors - they're already handled by Redis config
reviewQueue.on('error', (error) => {
  // Suppress ECONNREFUSED errors - Redis config already logs these
  if (error.code === 'ECONNREFUSED' || 
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('connect ECONNREFUSED')) {
    // Silently ignore - Redis connection errors are already logged
    return;
  }
  // Log other errors normally
  console.error('Review queue error:', error);
});

module.exports = reviewQueue;

