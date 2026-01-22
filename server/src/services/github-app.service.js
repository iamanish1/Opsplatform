/**
 * GitHub App Service
 * Handles GitHub App installations and events
 */

const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const userRepo = require('../repositories/user.repo');

class GitHubAppService {
  constructor() {
    this.appId = process.env.GITHUB_APP_ID;
    this.privateKey = process.env.GITHUB_PRIVATE_KEY;
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  }

  /**
   * Verify GitHub webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - X-Hub-Signature-256 header
   */
  verifyWebhookSignature(payload, signature) {
    if (!signature || !this.webhookSecret) {
      logger.warn('Webhook signature verification skipped - missing data');
      return false;
    }

    try {
      const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const expectedSignature = `sha256=${hash}`;
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      return isValid;
    } catch (error) {
      logger.error({ error: error.message }, 'Signature verification error');
      return false;
    }
  }

  /**
   * Handle GitHub App installation event
   * When user installs your app, save the installationId
   */
  async handleInstallation(event) {
    try {
      const { 
        action,           // 'created' or 'deleted'
        installation,     // Installation object
        repositories_added,
        sender,           // User who installed the app
      } = event;

      logger.info({ 
        action, 
        installationId: installation.id,
        githubUser: sender.login 
      }, 'GitHub App installation event received');

      if (action === 'created') {
        // User installed the app
        const installationId = installation.id;
        const githubUsername = sender.login;
        const githubId = sender.id;

        // Find user by GitHub username or ID
        let user = await userRepo.findByGithubId(githubId);

        if (!user) {
          // Also try by username
          const userByUsername = await userRepo.findOne({ githubUsername });
          if (userByUsername) {
            user = userByUsername;
          }
        }

        if (!user) {
          // Create user if doesn't exist
          user = await userRepo.create({
            email: `${githubUsername}@github.local`, // Temporary email
            name: sender.name || githubUsername,
            avatar: sender.avatar_url,
            githubId,
            githubUsername,
            githubInstallId: installationId, // ✅ SET INSTALLATION ID
            role: 'STUDENT',
          });
          logger.info({ userId: user.id }, 'User created from GitHub App installation');
        } else {
          // Update existing user with installation ID
          user = await userRepo.update(user.id, {
            githubInstallId: installationId, // ✅ UPDATE INSTALLATION ID
          });
          logger.info({ userId: user.id }, 'User updated with GitHub App installation ID');
        }

        // Log repositories that were granted access
        if (repositories_added && repositories_added.length > 0) {
          logger.info(
            { 
              githubInstallId: installationId,
              repos: repositories_added.map(r => r.full_name)
            },
            'App granted access to repositories'
          );
        }

        return { success: true, userId: user.id, installationId };
      }

      if (action === 'deleted') {
        // User uninstalled the app
        const installationId = installation.id;

        const user = await userRepo.updateByGithubInstallId(installationId, {
          githubInstallId: null, // Clear installation ID
        });

        if (user) {
          logger.info({ userId: user.id }, 'GitHub App uninstalled');
        }
        return { success: true, uninstalled: true };
      }

    } catch (error) {
      logger.error({ error: error.message }, 'Failed to handle GitHub App installation');
      throw error;
    }
  }

  /**
   * Handle GitHub App repository access change
   */
  async handleRepositoriesAccess(event) {
    try {
      const {
        action,
        installation,
        repositories_added,
        repositories_removed,
      } = event;

      logger.info({
        installationId: installation.id,
        action,
        added: repositories_added?.length || 0,
        removed: repositories_removed?.length || 0,
      }, 'GitHub App repository access changed');

      // Find user by installation ID
      const user = await userRepo.findOne({
        githubInstallId: installation.id,
      });

      if (!user) {
        logger.warn(
          { installationId: installation.id },
          'User not found for installation'
        );
        return;
      }

      // Log the changes
      if (repositories_added?.length > 0) {
        logger.info(
          { 
            userId: user.id,
            repos: repositories_added.map(r => r.full_name)
          },
          'Repositories added to app access'
        );
      }

      if (repositories_removed?.length > 0) {
        logger.info(
          { 
            userId: user.id,
            repos: repositories_removed.map(r => r.full_name)
          },
          'Repositories removed from app access'
        );
      }

      return { success: true };

    } catch (error) {
      logger.error({ error: error.message }, 'Failed to handle repository access change');
      throw error;
    }
  }

  /**
   * Generate JWT for GitHub App authentication
   */
  generateAppJWT() {
    if (!this.appId || !this.privateKey) {
      throw new Error('GitHub App credentials not configured');
    }

    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minutes
      iss: parseInt(this.appId),
    };

    const privateKey = this.privateKey.includes('\\n')
      ? this.privateKey.replace(/\\n/g, '\n')
      : this.privateKey;

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  }

  /**
   * Get installation access token
   * Used to authenticate API calls for a specific installation
   */
  async getInstallationAccessToken(installationId) {
    try {
      const appJwt = this.generateAppJWT();

      const response = await axios.post(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${appJwt}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Opsplatform-AI-Engine',
          },
          timeout: 10000,
        }
      );

      return response.data.token;
    } catch (error) {
      logger.error(
        { error: error.message, installationId },
        'Failed to get installation access token'
      );
      return null;
    }
  }

  /**
   * Get installation ID for user
   */
  async getInstallationId(userId) {
    try {
      const user = await userRepo.findById(userId);
      return user?.githubInstallId || null;
    } catch (error) {
      logger.error({ error: error.message, userId }, 'Failed to get installation ID');
      return null;
    }
  }

  /**
   * Check if user has app installed
   */
  async hasAppInstalled(userId) {
    try {
      const user = await userRepo.findById(userId);
      return !!user?.githubInstallId;
    } catch (error) {
      logger.error({ error: error.message, userId }, 'Failed to check app installation');
      return false;
    }
  }
}

module.exports = new GitHubAppService();
