const { Queue } = require('bullmq');
const config = require('../config');

// Parse Redis connection from URL or use host/port
let connection;
if (config.redis.url) {
  // Parse Redis URL (e.g., redis://localhost:6379 or redis://:password@host:port)
  connection = config.redis.url;
} else {
  connection = {
    host: config.redis.host,
    port: parseInt(config.redis.port, 10),
  };
}

// Create review queue
const reviewQueue = new Queue('reviewQueue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
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
reviewQueue.on('error', (error) => {
  console.error('Review queue error:', error);
});

module.exports = reviewQueue;

