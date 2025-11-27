const { Worker } = require('bullmq');
const redis = require('../config/redis');
const portfolioService = require('../services/portfolio.service');

// Concurrency: 1 (both dev and production)
// Can be overridden with QUEUE_CONCURRENCY_PORTFOLIO env var
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_PORTFOLIO || '1', 10);

const worker = new Worker(
  'portfolioQueue',
  async (job) => {
    const { userId } = job.data;
    
    console.log(`[Portfolio Worker] Processing job ${job.id}:`, {
      userId,
    });

    try {
      // Generate portfolio
      const result = await portfolioService.generate(job.data);
      
      console.log(`[Portfolio Worker] Portfolio generated for job ${job.id}:`, result);

      return result;
    } catch (error) {
      console.error(`[Portfolio Worker] Error processing job ${job.id}:`, {
        error: error.message,
        stack: error.stack,
        userId,
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
  console.log(`[Portfolio Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Portfolio Worker] Job ${job.id} failed:`, {
    error: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    userId: job.data?.userId,
  });
});

worker.on('error', (err) => {
  console.error('[Portfolio Worker] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`[Portfolio Worker] Job ${jobId} stalled`);
});

console.log(`[Portfolio Worker] Started with concurrency: ${concurrency}`);

module.exports = worker;

