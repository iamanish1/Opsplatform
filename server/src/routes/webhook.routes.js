const express = require('express');
const router = express.Router();

const webhookController = require('../controllers/webhook.controller');
const { verifyWebhookSignature } = require('../middlewares/github-webhook.middleware');

/**
 * POST /api/webhooks/github
 * GitHub webhook handler
 * No authentication required (GitHub signs requests)
 * Note: This route is mounted in app.js with express.raw() for signature verification
 */
router.post('/github', verifyWebhookSignature, webhookController.handleGitHubWebhook);

module.exports = router;

