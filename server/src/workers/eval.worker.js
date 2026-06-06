/**
 * Eval Worker — runs on VPS3 ONLY
 *
 * Subscribes to the evalQueue and processes Docker execution jobs.
 * Results are published back via Redis pub/sub so VPS1 can pick them up.
 *
 * This worker must NOT have DATABASE_URL configured.
 * It only needs REDIS_URL.
 *
 * Start on VPS3:
 *   pm2 start src/workers/eval.worker.js --name devhubs-eval-worker -i 2
 */

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const { runEvaluation } = require('../services/eval/eval.service');
const logger = require('../utils/logger');

const CONCURRENCY = parseInt(
  process.env.EVAL_QUEUE_CONCURRENCY || '2',
  10
);

// Redis pub/sub channel — review worker subscribes to this channel on VPS1
const RESULT_CHANNEL = 'devhubs:eval:results';

const worker = new Worker(
  'evalQueue',
  async (job) => {
    const { submissionId, repoUrl, projectSlug, hasHiddenTests } = job.data;
    const start = Date.now();

    logger.info(
      { jobId: job.id, submissionId, projectSlug, hasHiddenTests },
      '[Eval Worker] Job received'
    );

    try {
      const evalResult = await runEvaluation({
        submissionId,
        repoUrl,
        projectSlug,
        hasHiddenTests: Boolean(hasHiddenTests),
      });

      const duration = Date.now() - start;
      logger.info(
        {
          jobId: job.id,
          submissionId,
          dockerBuildSuccess: evalResult.dockerBuildSuccess,
          hiddenTestPassRate: evalResult.hiddenTestPassRate,
          duration: `${duration}ms`,
        },
        '[Eval Worker] Evaluation complete'
      );

      // Publish result to Redis pub/sub so review worker on VPS1 can receive it
      const publishClient = redis.duplicate();
      await publishClient.publish(
        RESULT_CHANNEL,
        JSON.stringify({ submissionId, result: evalResult })
      );
      publishClient.disconnect();

      return evalResult;
    } catch (error) {
      logger.error(
        { jobId: job.id, submissionId, error: error.message },
        '[Eval Worker] Job failed'
      );

      // Publish a failure result so the review pipeline doesn't hang waiting
      try {
        const publishClient = redis.duplicate();
        await publishClient.publish(
          RESULT_CHANNEL,
          JSON.stringify({
            submissionId,
            result: {
              submissionId,
              evalError: error.message,
              dockerBuildSuccess: false,
              hiddenTestPassRate: null,
            },
          })
        );
        publishClient.disconnect();
      } catch (_) {
        // Best-effort publish
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
  }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, '[Eval Worker] Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, '[Eval Worker] Job failed permanently');
});

worker.on('error', (err) => {
  logger.error({ error: err.message }, '[Eval Worker] Worker error');
});

logger.info({ concurrency: CONCURRENCY }, '[Eval Worker] Started');

module.exports = worker;
