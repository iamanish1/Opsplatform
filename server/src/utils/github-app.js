const { createAppAuth } = require('@octokit/auth-app');
const { Octokit } = require('@octokit/rest');
const crypto = require('crypto');
const config = require('../config');

let appAuth = null;
let octokit = null;

/**
 * Initialize GitHub App authentication
 * @returns {Object} App auth instance
 */
function getAppAuth() {
  if (!appAuth) {
    const appId = config.githubApp.appId;
    const privateKey = config.githubApp.privateKey;

    if (!appId || !privateKey) {
      throw new Error('GitHub App credentials are not configured');
    }

    appAuth = createAppAuth({
      appId: appId,
      privateKey: privateKey,
    });
  }

  return appAuth;
}

/**
 * Generate JWT token for GitHub App
 * @returns {Promise<string>} JWT token
 */
async function createAppToken() {
  try {
    const auth = getAppAuth();
    const { token } = await auth({ type: 'app' });
    return token;
  } catch (error) {
    const appError = new Error('Failed to create GitHub App token');
    appError.code = 'GITHUB_APP_ERROR';
    appError.originalError = error;
    throw appError;
  }
}

/**
 * Generate installation access token
 * @param {string} installationId - GitHub App installation ID
 * @returns {Promise<string>} Installation access token
 */
async function createInstallationToken(installationId) {
  try {
    const auth = getAppAuth();
    const { token } = await auth({
      type: 'installation',
      installationId: installationId,
    });
    return token;
  } catch (error) {
    const installError = new Error('Failed to create installation token');
    installError.code = 'INSTALLATION_TOKEN_ERROR';
    installError.originalError = error;
    throw installError;
  }
}

/**
 * Get installation details
 * @param {string} installationId - GitHub App installation ID
 * @returns {Promise<Object>} Installation details
 */
async function getInstallation(installationId) {
  try {
    const appToken = await createAppToken();
    const octokit = new Octokit({
      auth: appToken,
    });

    const { data } = await octokit.apps.getInstallation({
      installation_id: parseInt(installationId),
    });

    return data;
  } catch (error) {
    const installError = new Error('Failed to get installation details');
    installError.code = 'INSTALLATION_NOT_FOUND';
    installError.originalError = error;
    throw installError;
  }
}

/**
 * Verify GitHub webhook signature using SHA256
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Hub-Signature-256 header value
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  const webhookSecret = config.githubApp.webhookSecret;
  const logger = require('./logger');

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('GITHUB_WEBHOOK_SECRET is not configured in production - webhook security is disabled');
      return false; // Fail in production if secret not set
    }
    logger.warn('GITHUB_WEBHOOK_SECRET is not configured, skipping signature verification');
    return true; // Allow in development if secret not set
  }

  if (!signature) {
    logger.warn('Webhook signature header missing');
    return false;
  }

  // Extract signature value (remove 'sha256=' prefix if present)
  const receivedSig = signature.startsWith('sha256=') 
    ? signature.substring(7) 
    : signature;

  // Create HMAC SHA256 hash
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(payload, 'utf8');
  const expectedDigest = hmac.digest('hex');

  // Compare signatures using timing-safe comparison to prevent timing attacks
  if (receivedSig.length !== expectedDigest.length) {
    logger.warn('Webhook signature length mismatch');
    return false;
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedSig, 'hex'),
    Buffer.from(expectedDigest, 'hex')
  );

  if (!isValid) {
    logger.warn('Invalid webhook signature detected', {
      receivedLength: receivedSig.length,
      expectedLength: expectedDigest.length,
    });
  }

  return isValid;
}

/**
 * Get Octokit instance for API calls
 * @param {string} installationId - Optional installation ID
 * @returns {Promise<Object>} Octokit instance
 */
async function getOctokit(installationId = null) {
  let token;

  if (installationId) {
    token = await createInstallationToken(installationId);
  } else {
    token = await createAppToken();
  }

  return new Octokit({
    auth: token,
  });
}

module.exports = {
  createAppToken,
  createInstallationToken,
  getInstallation,
  verifyWebhookSignature,
  getOctokit,
};

