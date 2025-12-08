const { Queue } = require('bullmq');
const redis = require('../config/redis');

// Create score queue
// Concurrency: 1 (dev), 2 (production) - configured in worker
const scoreQueue = new Queue('scoreQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5, // Retry up to 5 times for database failures, calculation errors
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
scoreQueue.on('error', (error) => {
  // Suppress ECONNREFUSED errors - Redis config already logs these
  if (error.code === 'ECONNREFUSED' || 
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('connect ECONNREFUSED')) {
    // Silently ignore - Redis connection errors are already logged
    return;
  }
  // Log other errors normally
  console.error('Score queue error:', error);
});

module.exports = scoreQueue;

