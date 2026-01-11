const Queue = require('bullmq');
const Redis = require('ioredis');
const logger = require('../../config/logger');

/**
 * Dead Letter Queue for failed review jobs
 * Never removes jobs - maintains full audit trail of failures
 */
const deadLetterQueue = new Queue('dead-letter', {
  connection: new Redis(process.env.REDIS_URL),
  defaultJobOptions: {
    removeOnComplete: false, // Keep all completed jobs
    removeOnFail: false,      // Keep all failed jobs
    attempts: 1              // Don't retry - this is the final destination
  }
});

/**
 * Event: Job added to DLQ
 */
deadLetterQueue.on('added', (job) => {
  logger.error({
    jobId: job.id,
    jobName: job.name,
    originalQueueName: job.data.originalQueueName,
    failureReason: job.data.failureReason,
    failureCount: job.data.failureCount,
    lastError: job.data.lastError,
    timestamp: new Date().toISOString()
  }, 'Job added to Dead Letter Queue');
});

/**
 * Event: Job marked as failed in DLQ
 */
deadLetterQueue.on('failed', (job, err) => {
  logger.error({
    jobId: job.id,
    jobName: job.name,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  }, 'Job failed in Dead Letter Queue');
});

/**
 * Event: Job completed in DLQ (unlikely but possible if reprocessing)
 */
deadLetterQueue.on('completed', (job) => {
  logger.info({
    jobId: job.id,
    jobName: job.name,
    timestamp: new Date().toISOString()
  }, 'Job recovered from Dead Letter Queue');
});

module.exports = deadLetterQueue;
