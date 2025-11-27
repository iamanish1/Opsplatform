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
 * Verify GitHub webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Hub-Signature-256 header value
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  const webhookSecret = config.githubApp.webhookSecret;

  if (!webhookSecret) {
    console.warn('GITHUB_WEBHOOK_SECRET is not configured, skipping signature verification');
    return true; // Allow in development if secret not set
  }

  if (!signature) {
    return false;
  }

  // Remove 'sha256=' prefix if present
  const sig = signature.replace('sha256=', '');

  // Create HMAC hash
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest.replace('sha256=', '')));
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

