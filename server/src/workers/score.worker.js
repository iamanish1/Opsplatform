const { Worker } = require('bullmq');
const redis = require('../config/redis');
const scoringService = require('../services/scoring.service');
const portfolioQueue = require('../queues/portfolio.queue');
const submissionRepo = require('../repositories/submission.repo');
const logger = require('../utils/logger');
const Sentry = require('../utils/sentry');

// Concurrency: 1 (dev), 2 (production)
// Can be overridden with QUEUE_CONCURRENCY_SCORE env var
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_SCORE || (process.env.NODE_ENV === 'production' ? '2' : '1'), 10);

const worker = new Worker(
  'scoreQueue',
  async (job) => {
    const { submissionId } = job.data;
    
    logger.info({
      jobId: job.id,
      submissionId,
    }, 'Score worker job received');

    try {
      // Generate score
      const result = await scoringService.generateScore(job.data);
      
      logger.info({
        jobId: job.id,
        submissionId,
        scoreId: result.scoreId,
        totalScore: result.totalScore,
      }, 'Score worker job completed');

      // Get submission to extract userId
      const submission = await submissionRepo.findById(submissionId);
      
      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // Update submission status to REVIEWED
      await submissionRepo.update(submissionId, {
        status: 'REVIEWED',
      });

      logger.info({ submissionId }, 'Score worker updated submission status to REVIEWED');

      // On success: enqueue portfolio job
      if (submission.userId) {
        await portfolioQueue.add('portfolio', {
          userId: submission.userId,
          submissionId,
        }, {
          jobId: `portfolio-${submission.userId}-${Date.now()}`,
        });

        logger.info({ userId: submission.userId, submissionId }, 'Score worker enqueued portfolio job');
      } else {
        logger.warn({ submissionId }, 'Score worker skipping portfolio generation - no userId');
      }

      return result;
    } catch (error) {
      logger.error({
        jobId: job.id,
        submissionId,
        error: error.message,
        stack: error.stack,
      }, 'Score worker job failed');

      // Send to Sentry
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
          tags: {
            worker: 'score',
            jobId: job.id,
            submissionId,
          },
        });
      }

      // Re-throw to let BullMQ handle retry
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: concurrency,
  }
);

// Event listeners
worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Score worker job completed successfully');
});

worker.on('failed', (job, err) => {
  logger.error({
    jobId: job.id,
    error: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    submissionId: job.data?.submissionId,
  }, 'Score worker job failed');
});

worker.on('error', (err) => {
  logger.error({ error: err.message, stack: err.stack }, 'Score worker error');
});

worker.on('stalled', (jobId) => {
  logger.warn({ jobId }, 'Score worker job stalled');
});

logger.info({ concurrency }, 'Score worker started');

module.exports = worker;

