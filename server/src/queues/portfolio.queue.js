const { Queue } = require('bullmq');
const redis = require('../config/redis');

// Create portfolio queue
// Concurrency: 1 (both dev and production) - configured in worker
const portfolioQueue = new Queue('portfolioQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times for generation failures
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
portfolioQueue.on('error', (error) => {
  console.error('Portfolio queue error:', error);
});

module.exports = portfolioQueue;

