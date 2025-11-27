const webhookService = require('../services/webhook.service');

/**
 * POST /api/webhooks/github
 * Handle GitHub webhook events
 * Always returns 200 to GitHub (even on errors) to prevent retries
 */
async function handleGitHubWebhook(req, res, next) {
  const startTime = Date.now();
  
  try {
    // Parse body if it's a string or Buffer (from raw body parser)
    let payload;
    if (typeof req.body === 'string') {
      payload = JSON.parse(req.body);
    } else if (Buffer.isBuffer(req.body)) {
      payload = JSON.parse(req.body.toString('utf8'));
    } else {
      payload = req.body;
    }

    // Extract event type from headers
    const event = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];
    
    if (!event) {
      console.warn('GitHub webhook received without x-github-event header');
      return res.status(200).json({
        success: false,
        message: 'Missing event type',
      });
    }

    console.log(`Received GitHub webhook: ${event} (delivery: ${deliveryId})`);

    let result = {
      processed: false,
      event: event,
    };

    // Route to appropriate handler based on event type
    switch (event) {
      case 'pull_request':
        result = await webhookService.handlePullRequest(payload, req.headers);
        break;

      case 'workflow_run':
        result = await webhookService.handleWorkflowRun(payload, req.headers);
        break;

      case 'installation':
        result = await webhookService.handleInstallation(payload, req.headers);
        break;

      case 'installation_repositories':
        // Optional: Handle repository access changes
        console.log('Installation repositories event received');
        result = {
          processed: false,
          reason: 'Not implemented yet',
        };
        break;

      case 'push':
        // Optional: Notify user to open PR
        console.log('Push event received (not processed)');
        result = {
          processed: false,
          reason: 'Push events not processed',
        };
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
        result = {
          processed: false,
          reason: `Event type ${event} not handled`,
        };
    }

    const processingTime = Date.now() - startTime;
    console.log(`Webhook processed in ${processingTime}ms: ${event} - ${result.processed ? 'success' : 'skipped'}`);

    // Always return 200 to acknowledge receipt (GitHub will retry if we return error)
    res.status(200).json({
      success: true,
      processed: result.processed,
      event: event,
      message: 'Webhook received',
    });
  } catch (error) {
    // Log error but still return 200 (GitHub will retry if we return error)
    const processingTime = Date.now() - startTime;
    console.error(`Webhook processing error (${processingTime}ms):`, {
      error: error.message,
      stack: error.stack,
      event: req.headers['x-github-event'],
    });
    
    res.status(200).json({
      success: false,
      error: {
        message: 'Webhook processing failed',
      },
    });
  }
}

module.exports = {
  handleGitHubWebhook,
};
