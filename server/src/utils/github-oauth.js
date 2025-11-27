const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

/**
 * Generate CSRF state token
 * @returns {string} Random state token
 */
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate GitHub OAuth authorization URL
 * @param {string} state - CSRF state token
 * @returns {string} GitHub OAuth URL
 */
function getOAuthUrl(state) {
  const clientId = config.github.clientId;
  const redirectUri = encodeURIComponent(config.github.redirectUri);
  const scope = 'read:user user:email';
  
  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not configured');
  }

  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
}

/**
 * Exchange OAuth code for access token
 * @param {string} code - OAuth authorization code
 * @returns {Promise<string>} Access token
 */
async function exchangeCodeForToken(code) {
  const clientId = config.github.clientId;
  const clientSecret = config.github.clientSecret;
  const redirectUri = config.github.redirectUri;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials are not configured');
  }

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.error) {
      const error = new Error(response.data.error_description || response.data.error);
      error.code = 'OAUTH_FAILED';
      throw error;
    }

    return response.data.access_token;
  } catch (error) {
    if (error.code === 'OAUTH_FAILED') {
      throw error;
    }
    const oauthError = new Error('Failed to exchange code for token');
    oauthError.code = 'OAUTH_FAILED';
    oauthError.originalError = error;
    throw oauthError;
  }
}

/**
 * Fetch user info from GitHub API
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<Object>} GitHub user data
 */
async function getGitHubUser(accessToken) {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return {
      githubId: String(response.data.id),
      githubUsername: response.data.login,
      githubProfile: response.data.html_url,
      name: response.data.name || response.data.login,
      avatar: response.data.avatar_url,
      email: response.data.email, // May be null
    };
  } catch (error) {
    const githubError = new Error('Failed to fetch GitHub user data');
    githubError.code = 'GITHUB_API_ERROR';
    githubError.originalError = error;
    throw githubError;
  }
}

/**
 * Fetch user emails from GitHub API (fallback when email is null)
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<string|null>} Primary email or first email
 */
async function getGitHubUserEmails(accessToken) {
  try {
    const response = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // Find primary email or first verified email
    const emails = response.data || [];
    const primaryEmail = emails.find((email) => email.primary && email.verified);
    if (primaryEmail) {
      return primaryEmail.email;
    }

    const verifiedEmail = emails.find((email) => email.verified);
    if (verifiedEmail) {
      return verifiedEmail.email;
    }

    // Return first email if no verified email found
    if (emails.length > 0) {
      return emails[0].email;
    }

    return null;
  } catch (error) {
    // If email endpoint fails, return null (not critical)
    console.warn('Failed to fetch GitHub user emails:', error.message);
    return null;
  }
}

module.exports = {
  generateState,
  getOAuthUrl,
  exchangeCodeForToken,
  getGitHubUser,
  getGitHubUserEmails,
};

