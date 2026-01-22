/**
 * GitHub App Webhook Routes
 * Receives events from GitHub when app is installed/uninstalled
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const githubAppService = require('../services/github-app.service');

/**
 * POST /webhooks/github-app
 * GitHub sends webhook events to this endpoint
 */
router.post('/github-app', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const eventType = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];

    // Get raw body for signature verification
    const payload = req.body;
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    logger.info({ 
      eventType, 
      deliveryId,
      hasSignature: !!signature 
    }, 'GitHub App webhook received');

    // Verify webhook signature
    const isValid = githubAppService.verifyWebhookSignature(payloadString, signature);

    if (!isValid) {
      logger.warn({ eventType, deliveryId }, 'Invalid GitHub webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse body if it's a string
    const body = typeof payload === 'string' ? JSON.parse(payload) : payload;

    // Handle different event types
    switch (eventType) {
      case 'installation':
        await githubAppService.handleInstallation(body);
        logger.info({ eventType, deliveryId }, 'Installation event processed');
        break;

      case 'installation_repositories':
        await githubAppService.handleRepositoriesAccess(body);
        logger.info({ eventType, deliveryId }, 'Repository access event processed');
        break;

      case 'push':
        // Handle push events if needed
        logger.debug({ 
          eventType, 
          deliveryId,
          repo: body.repository?.full_name 
        }, 'Push event received');
        break;

      case 'pull_request':
        // Handle PR events if needed
        logger.debug({ 
          eventType, 
          deliveryId,
          action: body.action 
        }, 'Pull request event received');
        break;

      default:
        logger.debug({ eventType, deliveryId }, 'Unhandled webhook event type');
    }

    res.json({ success: true, event: eventType, deliveryId });

  } catch (error) {
    logger.error({ 
      error: error.message,
      stack: error.stack 
    }, 'Webhook processing failed');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /webhooks/github-app/health
 * Health check endpoint for GitHub webhook
 */
router.get('/github-app/health', (req, res) => {
  res.json({ status: 'ok', service: 'github-app-webhook' });
});

module.exports = router;
