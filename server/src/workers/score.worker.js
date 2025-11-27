const { Worker } = require('bullmq');
const redis = require('../config/redis');
const scoringService = require('../services/scoring.service');
const portfolioQueue = require('../queues/portfolio.queue');
const submissionRepo = require('../repositories/submission.repo');

// Concurrency: 1 (dev), 2 (production)
// Can be overridden with QUEUE_CONCURRENCY_SCORE env var
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_SCORE || (process.env.NODE_ENV === 'production' ? '2' : '1'), 10);

const worker = new Worker(
  'scoreQueue',
  async (job) => {
    const { submissionId } = job.data;
    
    console.log(`[Score Worker] Processing job ${job.id}:`, {
      submissionId,
    });

    try {
      // Generate score
      const result = await scoringService.generateScore(job.data);
      
      console.log(`[Score Worker] Score generated for job ${job.id}:`, result);

      // Get submission to extract userId
      const submission = await submissionRepo.findById(submissionId);
      
      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // Update submission status to REVIEWED
      await submissionRepo.update(submissionId, {
        status: 'REVIEWED',
      });

      console.log(`[Score Worker] Updated submission ${submissionId} status to REVIEWED`);

      // On success: enqueue portfolio job
      if (submission.userId) {
        await portfolioQueue.add('portfolio', {
          userId: submission.userId,
        }, {
          jobId: `portfolio-${submission.userId}-${Date.now()}`,
        });

        console.log(`[Score Worker] Enqueued portfolio job for user ${submission.userId}`);
      } else {
        console.warn(`[Score Worker] Submission ${submissionId} has no userId, skipping portfolio generation`);
      }

      return result;
    } catch (error) {
      console.error(`[Score Worker] Error processing job ${job.id}:`, {
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
  console.log(`[Score Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Score Worker] Job ${job.id} failed:`, {
    error: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    submissionId: job.data?.submissionId,
  });
});

worker.on('error', (err) => {
  console.error('[Score Worker] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`[Score Worker] Job ${jobId} stalled`);
});

console.log(`[Score Worker] Started with concurrency: ${concurrency}`);

module.exports = worker;

