const { Queue } = require('bullmq');
const redis = require('../config/redis');

// Create notification queue
// Concurrency: 3 (can be configured via env var)
const notificationQueue = new Queue('notificationQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times for email failures
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay, exponential backoff
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
});

// Log queue events for debugging
notificationQueue.on('error', (error) => {
  console.error('Notification queue error:', error);
});

module.exports = notificationQueue;

