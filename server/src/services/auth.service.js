const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepo = require('../repositories/user.repo');
const githubOAuth = require('../utils/github-oauth');
const githubApp = require('../utils/github-app');

// Store state tokens temporarily (in production, use Redis or database)
const stateStore = new Map();

/**
 * Generate OAuth URL with state parameter
 * @returns {Object} { state, oauthUrl }
 */
function initiateOAuth() {
  // Generate state token
  const state = githubOAuth.generateState();
  
  // Store state with timestamp (expires in 10 minutes)
  stateStore.set(state, {
    timestamp: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const oauthUrl = githubOAuth.getOAuthUrl(state);
  
  return { state, oauthUrl };
}

/**
 * Validate state parameter
 * @param {string} state - State token to validate
 * @returns {boolean} True if valid
 */
function validateState(state) {
  const stored = stateStore.get(state);
  
  if (!stored) {
    return false;
  }

  // Check if expired
  if (Date.now() > stored.expiresAt) {
    stateStore.delete(state);
    return false;
  }

  // Remove used state
  stateStore.delete(state);
  return true;
}

/**
 * Handle OAuth callback - complete OAuth flow
 * @param {string} code - OAuth authorization code
 * @param {string} state - CSRF state token
 * @returns {Promise<Object>} { token, user }
 */
async function handleOAuthCallback(code, state) {
  // Validate state
  if (!validateState(state)) {
    const error = new Error('Invalid or expired state parameter');
    error.statusCode = 400;
    error.code = 'INVALID_STATE';
    throw error;
  }

  // Check if user cancelled
  if (!code) {
    const error = new Error('OAuth authorization was cancelled');
    error.statusCode = 400;
    error.code = 'OAUTH_CANCELLED';
    throw error;
  }

  try {
    // Exchange code for access token
    const accessToken = await githubOAuth.exchangeCodeForToken(code);

    // Fetch GitHub user data
    let githubUser = await githubOAuth.getGitHubUser(accessToken);

    // If email is null, try to fetch from emails endpoint
    if (!githubUser.email) {
      const email = await githubOAuth.getGitHubUserEmails(accessToken);
      if (email) {
        githubUser.email = email;
      }
    }

    // Upsert user in database
    const user = await upsertUserFromGitHub(githubUser);

    // Generate JWT token
    const token = generateJWT(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        githubUsername: user.githubUsername,
        githubProfile: user.githubProfile,
        role: user.role,
        onboardingStep: user.onboardingStep,
        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    if (error.code === 'OAUTH_FAILED' || error.code === 'GITHUB_API_ERROR') {
      const oauthError = new Error('GitHub OAuth failed');
      oauthError.statusCode = 500;
      oauthError.code = 'OAUTH_FAILED';
      oauthError.originalError = error;
      throw oauthError;
    }
    throw error;
  }
}

/**
 * Upsert user from GitHub data
 * @param {Object} githubData - GitHub user data
 * @returns {Promise<Object>} User object
 */
async function upsertUserFromGitHub(githubData) {
  try {
    // Check if user exists by GitHub ID
    let user = await userRepo.findByGithubId(githubData.githubId);

    if (user) {
      // Update existing user
      user = await userRepo.update(user.id, {
        githubId: githubData.githubId,
        githubUsername: githubData.githubUsername,
        githubProfile: githubData.githubProfile,
        name: githubData.name || user.name,
        avatar: githubData.avatar || user.avatar,
        email: githubData.email || user.email,
        onboardingStep: 1, // GitHub connected
      });
    } else {
      // Check if email exists (but different GitHub ID)
      if (githubData.email) {
        const existingUser = await userRepo.findByEmail(githubData.email);
        if (existingUser && existingUser.githubId !== githubData.githubId) {
          const error = new Error('Email already associated with another GitHub account');
          error.statusCode = 409;
          error.code = 'GITHUB_ID_CONFLICT';
          throw error;
        }
      }

      // Create new user
      user = await userRepo.create({
        githubId: githubData.githubId,
        githubUsername: githubData.githubUsername,
        githubProfile: githubData.githubProfile,
        name: githubData.name,
        avatar: githubData.avatar,
        email: githubData.email,
        onboardingStep: 1, // GitHub connected
        role: 'STUDENT',
      });
    }

    return user;
  } catch (error) {
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('githubId')) {
        const conflictError = new Error('GitHub account already linked to another user');
        conflictError.statusCode = 409;
        conflictError.code = 'GITHUB_ID_CONFLICT';
        throw conflictError;
      }
      if (error.meta?.target?.includes('email')) {
        const conflictError = new Error('Email already associated with another account');
        conflictError.statusCode = 409;
        conflictError.code = 'GITHUB_ID_CONFLICT';
        throw conflictError;
      }
    }
    throw error;
  }
}

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
function generateJWT(userId, role = 'STUDENT') {
  const payload = {
    sub: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Get authentication status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Auth status
 */
async function getAuthStatus(userId) {
  const user = await userRepo.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return {
    authenticated: true,
    oauthConnected: Boolean(user.githubId || user.githubUsername),
    githubAppInstalled: Boolean(user.githubInstallId),
  };
}

/**
 * Handle installation created event
 * @param {Object} installationData - Installation webhook data
 * @returns {Promise<Object>} Updated user
 */
async function handleInstallationCreated(installationData) {
  const installationId = String(installationData.id);
  const githubUserId = String(installationData.account?.id);

  if (!githubUserId) {
    const error = new Error('GitHub user ID not found in installation data');
    error.statusCode = 400;
    error.code = 'INVALID_INSTALLATION_DATA';
    throw error;
  }

  // Find user by GitHub ID
  let user = await userRepo.findByGithubId(githubUserId);

  if (user) {
    // Update existing user with installation ID
    user = await userRepo.setGithubInstall(user.id, installationId);

    // Emit GithubAppInstalled event
    try {
      const eventBus = require('../utils/eventBus');
      eventBus.emit('GithubAppInstalled', {
        userId: user.id,
        installationId,
      });
    } catch (eventError) {
      console.warn(`[Auth Service] Failed to emit GithubAppInstalled event: ${eventError.message}`);
      // Don't fail installation if event emission fails
    }
  } else {
    // Installation created before OAuth - store partial user
    // This will be merged when user completes OAuth
    // For now, we'll just log it and wait for OAuth
    console.log(`Installation ${installationId} created for GitHub user ${githubUserId}, but user not found. Will be linked on OAuth.`);
    
    // Optionally, create a placeholder user (not recommended)
    // For now, we'll just return null and handle it on OAuth
    return null;
  }

  return user;
}

/**
 * Handle installation deleted event
 * @param {string} installationId - Installation ID
 * @returns {Promise<Object>} Updated user
 */
async function handleInstallationDeleted(installationId) {
  // Find user by installation ID
  const user = await userRepo.findByGithubInstallId(installationId);

  if (user) {
    // Clear installation ID
    return await userRepo.clearGithubInstall(user.id);
  }

  return null;
}

module.exports = {
  initiateOAuth,
  handleOAuthCallback,
  upsertUserFromGitHub,
  generateJWT,
  getAuthStatus,
  handleInstallationCreated,
  handleInstallationDeleted,
};

