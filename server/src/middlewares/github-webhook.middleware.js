const githubApp = require('../utils/github-app');
const logger = require('../utils/logger');

/**
 * GitHub Webhook Signature Verification Middleware
 * Verifies X-Hub-Signature-256 header using SHA256
 */
const verifyWebhookSignature = (req, res, next) => {
  try {
    // Get signature from header (GitHub uses X-Hub-Signature-256 for SHA256)
    const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];

    if (!signature) {
      logger.warn({
        path: req.path,
        ip: req.ip,
      }, 'Webhook request missing signature header');
      return res.status(401).json({
        success: false,
        error: {
          code: 'WEBHOOK_SIGNATURE_MISSING',
          message: 'Webhook signature is required',
        },
      });
    }

    // Get raw body (should be Buffer from express.raw())
    let payload;
    if (Buffer.isBuffer(req.body)) {
      payload = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      payload = req.body;
    } else {
      // Fallback: stringify if already parsed (should not happen with raw body parser)
      logger.warn('Webhook body is not raw - signature verification may be incorrect');
      payload = JSON.stringify(req.body);
    }

    // Verify signature using SHA256
    const isValid = githubApp.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      logger.warn({
        path: req.path,
        ip: req.ip,
        event: req.body?.action || 'unknown',
      }, 'Invalid webhook signature - potential security threat');
      return res.status(401).json({
        success: false,
        error: {
          code: 'WEBHOOK_SIGNATURE_INVALID',
          message: 'Invalid webhook signature',
        },
      });
    }

    logger.debug({ path: req.path }, 'Webhook signature verified successfully');
    next();
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      path: req.path,
    }, 'Webhook signature verification error');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Webhook verification failed',
      },
    });
  }
};

module.exports = {
  verifyWebhookSignature,
};

