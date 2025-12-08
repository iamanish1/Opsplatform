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
// Suppress connection errors - they're already handled by Redis config
notificationQueue.on('error', (error) => {
  // Suppress ECONNREFUSED errors - Redis config already logs these
  if (error.code === 'ECONNREFUSED' || 
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('connect ECONNREFUSED')) {
    // Silently ignore - Redis connection errors are already logged
    return;
  }
  // Log other errors normally
  console.error('Notification queue error:', error);
});

module.exports = notificationQueue;

