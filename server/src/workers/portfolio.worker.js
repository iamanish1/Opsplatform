const { Worker } = require('bullmq');
const redis = require('../config/redis');
const portfolioService = require('../services/portfolio.service');
const logger = require('../utils/logger');
const Sentry = require('../utils/sentry');

// Concurrency: 1 (both dev and production)
// Can be overridden with QUEUE_CONCURRENCY_PORTFOLIO env var
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_PORTFOLIO || '1', 10);

const worker = new Worker(
  'portfolioQueue',
  async (job) => {
    const { userId, submissionId, scoreId } = job.data;
    
    logger.info({
      jobId: job.id,
      userId,
      submissionId,
      scoreId,
    }, 'Portfolio worker job received');

    try {
      // Generate portfolio
      const result = await portfolioService.generate(job.data);
      
      logger.info({
        jobId: job.id,
        portfolioId: result.portfolioId,
        slug: result.slug,
      }, 'Portfolio worker job completed');

      // Emit PortfolioReady event
      try {
        const eventBus = require('../utils/eventBus');
        eventBus.emit('PortfolioReady', {
          userId: job.data.userId,
          submissionId: job.data.submissionId,
          portfolioId: result.portfolioId,
        });
        logger.info({ portfolioId: result.portfolioId }, 'Portfolio worker emitted PortfolioReady event');
      } catch (eventError) {
        logger.warn({ error: eventError.message }, 'Portfolio worker failed to emit PortfolioReady event');
        // Don't fail the job if event emission fails
      }

      return result;
    } catch (error) {
      logger.error({
        jobId: job.id,
        userId,
        error: error.message,
        stack: error.stack,
      }, 'Portfolio worker job failed');

      // Send to Sentry
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
          tags: {
            worker: 'portfolio',
            jobId: job.id,
            userId,
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
  logger.info({ jobId: job.id }, 'Portfolio worker job completed successfully');
});

worker.on('failed', (job, err) => {
  logger.error({
    jobId: job.id,
    error: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    userId: job.data?.userId,
  }, 'Portfolio worker job failed');
});

worker.on('error', (err) => {
  logger.error({ error: err.message, stack: err.stack }, 'Portfolio worker error');
});

worker.on('stalled', (jobId) => {
  logger.warn({ jobId }, 'Portfolio worker job stalled');
});

logger.info({ concurrency }, 'Portfolio worker started');

module.exports = worker;

