const { Worker } = require('bullmq');
const redis = require('../config/redis');
const reviewService = require('../services/review.service');
const scoreQueue = require('../queues/score.queue');

// Concurrency: 1 (dev), 3 (production)
// Can be overridden with QUEUE_CONCURRENCY_REVIEW env var
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_REVIEW || (process.env.NODE_ENV === 'production' ? '3' : '1'), 10);

const worker = new Worker(
  'reviewQueue',
  async (job) => {
    const { submissionId, repoFullName, prNumber, event, action } = job.data;
    
    console.log(`[Review Worker] Processing job ${job.id}:`, {
      submissionId,
      repoFullName,
      prNumber,
      event,
      action,
    });

    try {
      // Process PR review
      const result = await reviewService.processPRReview(job.data);
      
      console.log(`[Review Worker] Review completed for job ${job.id}:`, result);

      // On success: enqueue score job
      await scoreQueue.add('score', {
        submissionId: submissionId,
      }, {
        jobId: `score-${submissionId}-${Date.now()}`,
      });

      console.log(`[Review Worker] Enqueued score job for submission ${submissionId}`);

      return result;
    } catch (error) {
      console.error(`[Review Worker] Error processing job ${job.id}:`, {
        error: error.message,
        stack: error.stack,
        submissionId,
      });
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

