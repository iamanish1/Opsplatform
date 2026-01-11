const axios = require('axios');
const logger = require('../utils/logger');

/**
 * GitHub API service for fetching PR information
 */

/**
 * Parse GitHub URL to get owner and repo
 * @param {string} repoUrl - Repository URL (https://github.com/owner/repo.git or https://github.com/owner/repo)
 * @returns {Object|null} {owner, repo} or null if invalid
 */
function parseGitHubUrl(repoUrl) {
  if (!repoUrl) return null;
  
  try {
    // Remove .git suffix if present
    let cleanUrl = repoUrl.replace(/\.git$/, '');
    
    // Extract owner and repo from URL
    // Format: https://github.com/owner/repo
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)$/);
    
    if (match && match[1] && match[2]) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  } catch (error) {
    logger.error({ error: error.message, repoUrl }, 'Error parsing GitHub URL');
  }
  
  return null;
}

/**
 * Get open PRs for a repository
 * @param {string} repoUrl - Repository URL
 * @returns {Promise<Array>} Array of PR objects or empty array
 */
async function getOpenPRs(repoUrl) {
  try {
    const parsed = parseGitHubUrl(repoUrl);
    
    if (!parsed) {
      logger.warn({ repoUrl }, 'Invalid GitHub URL format');
      return [];
    }
    
    const { owner, repo } = parsed;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`;
    
    logger.info({ apiUrl }, 'Fetching open PRs from GitHub API');
    
    // GitHub API doesn't require authentication for public repos
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Opsplatform-AI-Engine',
      },
      timeout: 10000,
    });
    
    return response.data || [];
  } catch (error) {
    logger.error(
      { error: error.message, repoUrl, status: error.response?.status },
      'Failed to fetch open PRs from GitHub'
    );
    return [];
  }
}

/**
 * Find PR number for a repository (latest open PR)
 * @param {string} repoUrl - Repository URL
 * @param {number} maxWaitTime - Maximum time to wait for PR to appear (ms)
 * @returns {Promise<number|null>} PR number or null if not found
 */
async function findLatestOpenPR(repoUrl, maxWaitTime = 30000) {
  try {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 6; // Try for ~30 seconds with 5s intervals
    
    while (attempts < maxAttempts && (Date.now() - startTime) < maxWaitTime) {
      const prs = await getOpenPRs(repoUrl);
      
      if (prs.length > 0) {
        // Return the most recent PR number
        const latestPr = prs[0]; // API returns sorted by creation date (newest first)
        logger.info(
          { repoUrl, prNumber: latestPr.number, createdAt: latestPr.created_at },
          'Found open PR'
        );
        return latestPr.number;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        // Wait 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    logger.warn({ repoUrl, attempts }, 'No open PR found after retries');
    return null;
  } catch (error) {
    logger.error({ error: error.message, repoUrl }, 'Error finding latest open PR');
    return null;
  }
}

/**
 * Diagnostic mechanism - aggressive retry for finding PR
 * Used as fallback when primary mechanism fails
 * Retries with shorter intervals and longer total timeout
 * @param {string} repoUrl - Repository URL
 * @param {number} maxWaitTime - Maximum time to wait (ms), default 60 seconds
 * @returns {Promise<number|null>} PR number or null if not found
 */
async function findPRWithDiagnostic(repoUrl, maxWaitTime = 60000) {
  try {
    logger.info({ repoUrl, maxWaitTime }, 'Starting diagnostic PR fetch mechanism');
    
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 12; // More aggressive: try every 5 seconds for ~60 seconds
    
    while (attempts < maxAttempts && (Date.now() - startTime) < maxWaitTime) {
      const prs = await getOpenPRs(repoUrl);
      
      if (prs.length > 0) {
        const latestPr = prs[0];
        logger.info(
          { repoUrl, prNumber: latestPr.number, createdAt: latestPr.created_at, mechanism: 'diagnostic', attempts },
          'Found open PR via diagnostic mechanism'
        );
        return latestPr.number;
      }
      
      attempts++;
      const elapsedTime = Date.now() - startTime;
      logger.debug(
        { repoUrl, attempt: attempts, elapsedTime, maxAttempts },
        'Diagnostic attempt - PR not found yet'
      );
      
      if (attempts < maxAttempts && elapsedTime < maxWaitTime) {
        // Wait 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    logger.warn({ repoUrl, attempts, maxWaitTime }, 'Diagnostic mechanism: No open PR found after all retries');
    return null;
  } catch (error) {
    logger.error({ error: error.message, repoUrl }, 'Error in diagnostic PR fetch mechanism');
    return null;
  }
}

/**
 * Get PR details
 * @param {string} repoUrl - Repository URL
 * @param {number} prNumber - PR number
 * @returns {Promise<Object|null>} PR object or null
 */
async function getPRDetails(repoUrl, prNumber) {
  try {
    const parsed = parseGitHubUrl(repoUrl);
    
    if (!parsed || !prNumber) {
      return null;
    }
    
    const { owner, repo } = parsed;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Opsplatform-AI-Engine',
      },
      timeout: 10000,
    });
    
    return response.data || null;
  } catch (error) {
    logger.error(
      { error: error.message, repoUrl, prNumber, status: error.response?.status },
      'Failed to fetch PR details from GitHub'
    );
    return null;
  }
}

module.exports = {
  parseGitHubUrl,
  getOpenPRs,
  findLatestOpenPR,
  findPRWithDiagnostic,
  getPRDetails,
};
