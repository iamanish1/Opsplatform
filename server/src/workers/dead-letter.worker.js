const { Worker } = require('bullmq');
const Redis = require('ioredis');
const deadLetterQueue = require('../../queues/dead-letter.queue');
const logger = require('../../utils/logger');

// Process dead letter queue jobs
const worker = new Worker(
  'dead-letter',
  async (job) => {
    const { originalJobId, submissionId, failureReason, failureCount, originalQueueName } = job.data;

    logger.warn({
      jobId: job.id,
      originalJobId,
      submissionId,
      originalQueue: originalQueueName,
      failureCount,
      failureReason
    }, 'Processing Dead Letter Queue job');

    try {
      // Log detailed failure information
      await logFailureMetrics({
        submissionId,
        failureReason,
        failureCount,
        originalQueue: originalQueueName,
        failedAt: job.data.failedAt || new Date().toISOString()
      });

      // Alert on critical failures
      if (failureCount >= 3) {
        await sendCriticalAlert({
          submissionId,
          failureCount,
          failureReason,
          originalQueue: originalQueueName
        });
      }

      logger.info({
        jobId: job.id,
        submissionId
      }, 'Dead Letter Queue job processed');

      return {
        processed: true,
        submissionId,
        failureCount
      };
    } catch (error) {
      logger.error({
        jobId: job.id,
        submissionId,
        error: error.message
      }, 'Failed to process Dead Letter Queue job');

      throw error;
    }
  },
  {
    connection: new Redis(process.env.REDIS_URL),
    concurrency: 1,
    settings: {
      retryProcessDelay: 60000 // 1 minute between processing attempts
    }
  }
);

/**
 * Log failure metrics for monitoring and debugging
 * @param {object} data - Failure data
 */
async function logFailureMetrics({
  submissionId,
  failureReason,
  failureCount,
  originalQueue,
  failedAt
}) {
  const redis = new Redis(process.env.REDIS_URL);

  try {
    const dateKey = new Date(failedAt).toISOString().split('T')[0];
    const metricsKey = `dlq:failures:${dateKey}`;

    // Track failures by type
    const failureType = failureReason.split(':')[0];
    await redis.incr(`${metricsKey}:${failureType}`);
    await redis.incr(`${metricsKey}:total`);

    // Log full failure details
    await redis.lpush(
      `dlq:failure:log:${dateKey}`,
      JSON.stringify({
        submissionId,
        failureReason,
        failureCount,
        originalQueue,
        failedAt,
        processedAt: new Date().toISOString()
      })
    );

    await redis.ltrim(`dlq:failure:log:${dateKey}`, 0, 10000);
    await redis.expire(`dlq:failure:log:${dateKey}`, 86400 * 30);

    logger.debug({ submissionId, failureCount }, 'Failure metrics logged');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to log failure metrics');
  } finally {
    await redis.quit();
  }
}

/**
 * Send critical alert for repeated failures
 * @param {object} data - Alert data
 */
async function sendCriticalAlert({ submissionId, failureCount, failureReason, originalQueue }) {
  try {
    // Log critical issue
    logger.error({
      submissionId,
      failureCount,
      failureReason,
      originalQueue
    }, 'CRITICAL: Job failed after max retries');

    // TODO: Integrate with alerting service (Slack, PagerDuty, etc.)
    // Example:
    // await notificationService.sendAlert({
    //   severity: 'critical',
    //   title: 'Job Max Retries Exceeded',
    //   message: `Submission ${submissionId} failed ${failureCount} times: ${failureReason}`,
    //   tags: { submissionId, queue: originalQueue }
    // });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send critical alert');
  }
}

// Event listeners
worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Dead Letter Queue job completed');
});

worker.on('failed', (job, err) => {
  logger.error({
    jobId: job.id,
    error: err.message,
    attemptsMade: job.attemptsMade
  }, 'Dead Letter Queue worker job failed');
});

worker.on('error', (err) => {
  logger.error({ error: err.message }, 'Dead Letter Queue worker error');
});

module.exports = worker;
