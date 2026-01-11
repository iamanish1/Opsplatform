const crypto = require('crypto');
const reviewQueue = require('../../queues/review.queue');
const deadLetterQueue = require('../../queues/dead-letter.queue');
const logger = require('../../utils/logger');

class GithubWebhookValidator {
  /**
   * Validate GitHub webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - X-Hub-Signature-256 header value
   * @param {string} secret - Webhook secret
   * @returns {boolean} Signature is valid
   */
  static validateSignature(payload, signature, secret) {
    if (!signature || !secret) {
      logger.warn('Webhook signature or secret missing');
      return false;
    }

    try {
      // GitHub sends as sha256=<hash>
      const [algorithm, hash] = signature.split('=');
      if (algorithm !== 'sha256') {
        logger.warn({ algorithm }, 'Unexpected signature algorithm');
        return false;
      }

      // Compute expected signature
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expected = hmac.digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const result = crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(hash)
      );

      if (!result) {
        logger.error('Webhook signature validation failed');
      }

      return result;
    } catch (error) {
      logger.error({ error: error.message }, 'Webhook signature validation error');
      return false;
    }
  }

  /**
   * Extract submission ID from webhook payload
   * @param {object} payload - GitHub webhook payload
   * @returns {string|null} Submission ID or null
   */
  static extractSubmissionId(payload) {
    // Try multiple sources for submission ID
    const sources = [
      // Option 1: Direct from body
      payload.submissionId,
      // Option 2: From PR labels (format: "submission-<id>")
      payload.pull_request?.labels
        ?.find(l => l.name.startsWith('submission-'))
        ?.name.replace('submission-', ''),
      // Option 3: From custom header in body
      payload._submissionId,
      // Option 4: Generate from repo URL and PR number
      payload.repository && payload.pull_request
        ? this.generateIdFromPR(payload.repository.full_name, payload.pull_request.number)
        : null
    ];

    return sources.find(id => id) || null;
  }

  /**
   * Generate submission ID from PR info (fallback)
   * @private
   * @param {string} repoFullName - Repository full name
   * @param {number} prNumber - PR number
   * @returns {string} Generated ID
   */
  static generateIdFromPR(repoFullName, prNumber) {
    // Create deterministic ID from repo and PR
    return crypto
      .createHash('md5')
      .update(`${repoFullName}:${prNumber}`)
      .digest('hex')
      .substring(0, 12);
  }
}

class WebhookEnqueueService {
  constructor(maxRetries = 3) {
    this.maxRetries = maxRetries;
  }

  /**
   * Enqueue review job with retry logic
   * @param {object} jobPayload - Job payload
   * @param {object} options - Options
   * @param {number} options.attempt - Current attempt number
   * @param {number} options.maxRetries - Max retry attempts
   * @returns {Promise<string|null>} Job ID or null if failed
   */
  async enqueueWithRetry(jobPayload, { attempt = 1, maxRetries = this.maxRetries } = {}) {
    try {
      const job = await reviewQueue.add('review', jobPayload, {
        jobId: `${jobPayload.submissionId}-${jobPayload.prNumber}-${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      logger.info(
        { jobId: job.id, submissionId: jobPayload.submissionId },
        'Review job enqueued successfully'
      );

      return job.id;
    } catch (error) {
      logger.error(
        { error: error.message, attempt, maxRetries },
        'Failed to enqueue review job'
      );

      if (attempt < maxRetries) {
        // Calculate exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        logger.info({ delay, nextAttempt: attempt + 1 }, 'Retrying enqueue');

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.enqueueWithRetry(jobPayload, {
          attempt: attempt + 1,
          maxRetries
        });
      }

      // All retries failed - move to DLQ
      return this.moveToDeadLetter(jobPayload, error);
    }
  }

  /**
   * Move failed webhook to dead letter queue
   * @param {object} jobPayload - Original job payload
   * @param {Error} error - Error that caused failure
   * @returns {Promise<string|null>} DLQ job ID or null
   */
  async moveToDeadLetter(jobPayload, error) {
    try {
      const dlqJob = await deadLetterQueue.add('webhook-failed', {
        originalQueueName: 'review',
        originalPayload: jobPayload,
        failureReason: error.message,
        failureStack: error.stack,
        failedAt: new Date().toISOString(),
        submissionId: jobPayload.submissionId,
        prNumber: jobPayload.prNumber,
        repoFullName: jobPayload.repoFullName
      }, {
        jobId: `dlq-webhook-${jobPayload.submissionId}-${Date.now()}`,
        removeOnComplete: false,
        removeOnFail: false
      });

      logger.error(
        { dlqJobId: dlqJob.id, submissionId: jobPayload.submissionId },
        'Webhook moved to Dead Letter Queue'
      );

      return dlqJob.id;
    } catch (dlqError) {
      logger.error(
        { error: dlqError.message, submissionId: jobPayload.submissionId },
        'Failed to move webhook to Dead Letter Queue'
      );
      return null;
    }
  }

  /**
   * Health check for webhook processing
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      const queueHealth = await reviewQueue.getJobCounts();
      const dlqHealth = await deadLetterQueue.getJobCounts();

      return {
        status: 'healthy',
        reviewQueue: {
          waiting: queueHealth.waiting,
          active: queueHealth.active,
          completed: queueHealth.completed,
          failed: queueHealth.failed
        },
        deadLetterQueue: {
          waiting: dlqHealth.waiting,
          active: dlqHealth.active,
          completed: dlqHealth.completed,
          failed: dlqHealth.failed
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = {
  GithubWebhookValidator,
  WebhookEnqueueService
};
