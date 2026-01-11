const Sentry = require('@sentry/node');
const logger = require('../../utils/logger');

class MonitoringService {
  constructor() {
    this.isInitialized = false;
    this.sampleRate = parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1');
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize Sentry monitoring
   * @param {object} options - Initialization options
   * @param {string} options.dsn - Sentry DSN
   * @param {string} options.environment - Environment name
   * @param {number} options.sampleRate - Error sample rate (0-1)
   * @param {string} options.release - Release version
   */
  initialize({ dsn, environment, sampleRate, release } = {}) {
    if (this.isInitialized) {
      logger.debug('Sentry already initialized');
      return;
    }

    const sentryDsn = dsn || process.env.SENTRY_DSN;
    if (!sentryDsn) {
      logger.warn('SENTRY_DSN not configured - error tracking disabled');
      return;
    }

    const config = {
      dsn: sentryDsn,
      environment: environment || this.environment,
      sampleRate: sampleRate !== undefined ? sampleRate : this.sampleRate,
      release: release || process.env.RELEASE_VERSION || '1.0.0',
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection()
      ]
    };

    Sentry.init(config);
    this.isInitialized = true;

    logger.info({ environment: config.environment, sampleRate: config.sampleRate }, 'Sentry initialized');
  }

  /**
   * Track review metrics
   * @param {object} metrics - Metrics to track
   * @param {string} metrics.submissionId - Submission ID
   * @param {string} metrics.model - Model used
   * @param {number} metrics.duration - Processing duration (ms)
   * @param {number} metrics.inputTokens - Input tokens
   * @param {number} metrics.outputTokens - Output tokens
   * @param {number} metrics.cost - Cost in USD
   * @param {boolean} metrics.cached - Whether response was cached
   * @param {string} metrics.status - 'success' or 'failure'
   */
  trackReviewMetrics({
    submissionId,
    model,
    duration,
    inputTokens,
    outputTokens,
    cost,
    cached = false,
    status = 'success'
  }) {
    const tags = {
      service: 'review',
      model,
      status,
      cached: cached.toString()
    };

    const extra = {
      submissionId,
      duration,
      inputTokens,
      outputTokens,
      cost: cost.toFixed(6)
    };

    if (this.isInitialized) {
      Sentry.captureMessage('Review processed', {
        level: status === 'success' ? 'info' : 'warning',
        tags,
        extra
      });
    }

    logger.info({ submissionId, model, duration, cost: cost.toFixed(6), cached, status }, 'Review metrics');
  }

  /**
   * Track error with context
   * @param {Error} error - Error object
   * @param {object} context - Error context
   * @param {string} context.submissionId - Submission ID
   * @param {string} context.jobId - Job ID
   * @param {string} context.worker - Worker name
   * @param {number} context.attempt - Attempt number
   * @param {object} context.extra - Extra data
   */
  trackError(error, { submissionId, jobId, worker, attempt, extra = {} } = {}) {
    const tags = {
      service: 'review',
      worker,
      error: error.message
    };

    const errorExtra = {
      submissionId,
      jobId,
      attempt,
      ...extra
    };

    if (this.isInitialized) {
      Sentry.captureException(error, {
        tags,
        extra: errorExtra
      });
    }

    logger.error(
      { submissionId, jobId, worker, attempt, error: error.message },
      'Review error tracked'
    );
  }

  /**
   * Track cost warning or alert
   * @param {object} data - Warning data
   * @param {number} data.spent - Amount spent
   * @param {number} data.budget - Budget limit
   * @param {number} data.percentageUsed - Percentage used
   * @param {string} data.month - Month (YYYY-MM)
   */
  trackCostWarning({ spent, budget, percentageUsed, month }) {
    const level = percentageUsed >= 100 ? 'error' : percentageUsed >= 80 ? 'warning' : 'info';
    const message = percentageUsed >= 100
      ? 'Budget exceeded!'
      : percentageUsed >= 80
      ? 'Budget warning: 80% used'
      : 'Budget tracking';

    if (this.isInitialized) {
      Sentry.captureMessage(message, {
        level,
        tags: {
          service: 'cost-tracking',
          period: month
        },
        extra: {
          spent: spent.toFixed(4),
          budget,
          percentageUsed: percentageUsed.toFixed(2)
        }
      });
    }

    logger.warn(
      { spent: spent.toFixed(4), budget, percentageUsed: percentageUsed.toFixed(2), month },
      message
    );
  }

  /**
   * Create transaction for performance monitoring
   * @param {string} name - Transaction name
   * @param {string} op - Operation type
   * @returns {object} Transaction object
   */
  createTransaction(name, op = 'http.server') {
    if (!this.isInitialized) {
      return { finish: () => {} };
    }

    return Sentry.startTransaction({
      name,
      op
    });
  }

  /**
   * Finish transaction
   * @param {object} transaction - Transaction object
   * @param {string} status - Status ('ok', 'cancelled', 'unknown', 'unauthenticated', 'permission_denied', 'invalid_argument', 'deadline_exceeded', 'not_found', 'already_exists', 'permission_denied', 'resource_exhausted', 'failed_precondition', 'aborted', 'out_of_range', 'unimplemented', 'internal_error', 'unavailable', 'data_loss')
   */
  finishTransaction(transaction, status = 'ok') {
    if (transaction && transaction.finish) {
      transaction.setStatus(status);
      transaction.finish();
    }
  }

  /**
   * Get Sentry instance for custom usage
   * @returns {object} Sentry instance
   */
  getSentry() {
    return Sentry;
  }

  /**
   * Check if monitoring is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }
}

module.exports = new MonitoringService();
