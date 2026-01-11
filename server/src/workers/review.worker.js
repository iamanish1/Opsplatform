const { Worker } = require('bullmq');
const redis = require('../config/redis');
const reviewService = require('../services/review.service');
const scoreQueue = require('../queues/score.queue');
const deadLetterQueue = require('../queues/dead-letter.queue');
const logger = require('../utils/logger');
const Sentry = require('../utils/sentry');

// Concurrency: 1 (dev), 3 (production)
// Can be overridden with QUEUE_CONCURRENCY_REVIEW env var
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_REVIEW || (process.env.NODE_ENV === 'production' ? '3' : '1'), 10);

// Job timeout: 5 minutes (300 seconds)
const JOB_TIMEOUT_MS = 300000;

// Maximum retry attempts before moving to DLQ
const MAX_RETRY_ATTEMPTS = 3;

const worker = new Worker(
  'reviewQueue',
  async (job) => {
    const { submissionId, repoFullName, prNumber, event, action } = job.data;
    const startTime = Date.now();
    
    logger.info({
      jobId: job.id,
      submissionId,
      repoFullName,
      prNumber,
      event,
      action,
      attempt: job.attemptsMade + 1,
      maxAttempts: MAX_RETRY_ATTEMPTS
    }, 'Review worker job received');

    try {
      // Set job timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job execution timeout')), JOB_TIMEOUT_MS)
      );

      // Race between job execution and timeout
      const result = await Promise.race([
        reviewService.processPRReview(job.data),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      
      logger.info({
        jobId: job.id,
        submissionId,
        duration: `${duration}ms`,
        result,
      }, 'Review worker job completed successfully');

      // On success: enqueue score job
      await scoreQueue.add('score', {
        submissionId: submissionId,
      }, {
        jobId: `score-${submissionId}-${Date.now()}`,
      });

      logger.info({ submissionId }, 'Review worker enqueued score job');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = error.message === 'Job execution timeout';
      
      logger.error({
        jobId: job.id,
        submissionId,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
        attempt: job.attemptsMade + 1,
        isTimeout
      }, 'Review worker job failed');

      // Send to Sentry
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
          tags: {
            worker: 'review',
            jobId: job.id,
            submissionId,
            attempt: job.attemptsMade + 1,
            isTimeout
          },
          extra: {
            duration,
            attempt: job.attemptsMade + 1
          }
        });
      }

      // If max retries exceeded, move to dead letter queue
      if (job.attemptsMade >= MAX_RETRY_ATTEMPTS - 1) {
        logger.error({
          jobId: job.id,
          submissionId,
          failureCount: job.attemptsMade + 1,
          failureReason: error.message
        }, 'Max retries exceeded - moving to Dead Letter Queue');

        // Add to DLQ for manual review
        await deadLetterQueue.add('review-failed', {
          originalJobId: job.id,
          submissionId,
          repoFullName,
          prNumber,
          event,
          action,
          originalQueueName: 'reviewQueue',
          failureReason: error.message,
          failureCount: job.attemptsMade + 1,
          lastError: error.stack,
          jobData: job.data,
          failedAt: new Date().toISOString()
        }, {
          jobId: `dlq-review-${submissionId}-${Date.now()}`,
          removeOnComplete: false,
          removeOnFail: false
        });
      }

      // Re-throw to let BullMQ handle retry (if not max attempts)
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: concurrency,
    settings: {
      retryProcessDelay: (attemptsMade) => {
        // Exponential backoff: 1s, 5s, 20s
        return Math.min(1000 * Math.pow(2, attemptsMade), 60000);
      }
    }
  }
);

// Event listeners
worker.on('completed', (job) => {
  console.log(`[Review Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Review Worker] Job ${job.id} failed:`, {
    error: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    submissionId: job.data?.submissionId,
  });
});

worker.on('error', (err) => {
  console.error('[Review Worker] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`[Review Worker] Job ${jobId} stalled`);
});

console.log(`[Review Worker] Started with concurrency: ${concurrency}`);

module.exports = worker;

