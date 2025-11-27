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
scoreQueue.on('error', (error) => {
  console.error('Score queue error:', error);
});

module.exports = scoreQueue;

