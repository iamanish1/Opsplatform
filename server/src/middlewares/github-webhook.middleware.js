const githubApp = require('../utils/github-app');

/**
 * GitHub Webhook Signature Verification Middleware
 * Verifies X-Hub-Signature-256 header
 */
const verifyWebhookSignature = (req, res, next) => {
  try {
    // Get signature from header
    const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];

    if (!signature) {
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
      // Fallback: stringify if already parsed
      payload = JSON.stringify(req.body);
    }

    // Verify signature
    const isValid = githubApp.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'WEBHOOK_SIGNATURE_INVALID',
          message: 'Invalid webhook signature',
        },
      });
    }

    next();
  } catch (error) {
    console.error('Webhook signature verification error:', error);
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

