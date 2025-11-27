const authService = require('../services/auth.service');

/**
 * POST /api/webhooks/github
 * Handle GitHub webhook events
 */
async function handleGitHubWebhook(req, res, next) {
  try {
    const event = req.headers['x-github-event'];
    
    // Parse body if it's a string (from raw body parser)
    let payload;
    if (typeof req.body === 'string') {
      payload = JSON.parse(req.body);
    } else if (Buffer.isBuffer(req.body)) {
      payload = JSON.parse(req.body.toString('utf8'));
    } else {
      payload = req.body;
    }

    console.log(`Received GitHub webhook: ${event}`);

    // Handle different event types
    switch (event) {
      case 'installation':
        await handleInstallationEvent(payload);
        break;

      case 'installation_repositories':
        // Handle repository access changes
        console.log('Installation repositories event received');
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    // Log error but still return 200 (GitHub will retry if we return error)
    console.error('Webhook processing error:', error);
    res.status(200).json({
      success: false,
      error: {
        message: 'Webhook processing failed',
      },
    });
  }
}

/**
 * Handle installation events
 * @param {Object} payload - Webhook payload
 */
async function handleInstallationEvent(payload) {
  const action = payload.action;

  switch (action) {
    case 'created':
      await authService.handleInstallationCreated(payload.installation);
      console.log(`Installation created: ${payload.installation.id}`);
      break;

    case 'deleted':
      await authService.handleInstallationDeleted(String(payload.installation.id));
      console.log(`Installation deleted: ${payload.installation.id}`);
      break;

    case 'suspend':
      // Handle suspension
      console.log(`Installation suspended: ${payload.installation.id}`);
      break;

    case 'unsuspend':
      // Handle unsuspension
      console.log(`Installation unsuspended: ${payload.installation.id}`);
      break;

    default:
      console.log(`Unhandled installation action: ${action}`);
  }
}

module.exports = {
  handleGitHubWebhook,
};

