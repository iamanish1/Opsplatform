/**
 * GitHub Service for Review Worker
 * Handles GitHub API calls for PR data, diff, files, and comments
 */

/**
 * Fetch PR metadata
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name (owner/repo)
 * @param {number} prNumber - PR number
 * @returns {Promise<Object>} PR metadata
 */
async function fetchPRMetadata(octokit, repoFullName, prNumber) {
  const [owner, repo] = repoFullName.split('/');

  try {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return {
      title: data.title,
      description: data.body || '',
      author: data.user.login,
      authorId: data.user.id,
      state: data.state,
      additions: data.additions,
      deletions: data.deletions,
      changedFiles: data.changed_files,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      mergedAt: data.merged_at,
      head: {
        sha: data.head.sha,
        ref: data.head.ref,
      },
      base: {
        sha: data.base.sha,
        ref: data.base.ref,
      },
    };
  } catch (error) {
    const githubError = new Error(`Failed to fetch PR metadata: ${error.message}`);
    githubError.code = 'GITHUB_API_ERROR';
    githubError.originalError = error;
    throw githubError;
  }
}

/**
 * Fetch PR diff and changed files
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name
 * @param {number} prNumber - PR number
 * @param {number} maxFiles - Maximum number of files to return (default: 5)
 * @param {number} maxLinesPerFile - Maximum lines per file (default: 1000)
 * @returns {Promise<Object>} PR diff data
 */
async function fetchPRDiff(octokit, repoFullName, prNumber, maxFiles = 5, maxLinesPerFile = 1000) {
  const [owner, repo] = repoFullName.split('/');

  try {
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100, // Get all files
    });

    // Sort by changes (additions + deletions) and take top files
    const sortedFiles = files
      .map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.additions + file.deletions,
        patch: file.patch || '',
      }))
      .sort((a, b) => b.changes - a.changes)
      .slice(0, maxFiles);

    // Limit patch size per file
    const limitedFiles = sortedFiles.map((file) => {
      if (file.patch) {
        const lines = file.patch.split('\n');
        if (lines.length > maxLinesPerFile) {
          file.patch = lines.slice(0, maxLinesPerFile).join('\n') + '\n... (truncated)';
        }
      }
      return file;
    });

    return {
      files: limitedFiles,
      totalFiles: files.length,
      totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
      totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
    };
  } catch (error) {
    const githubError = new Error(`Failed to fetch PR diff: ${error.message}`);
    githubError.code = 'GITHUB_API_ERROR';
    githubError.originalError = error;
    throw githubError;
  }
}

/**
 * Fetch PR files list
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name
 * @param {number} prNumber - PR number
 * @returns {Promise<Array>} List of changed files
 */
async function fetchPRFiles(octokit, repoFullName, prNumber) {
  const [owner, repo] = repoFullName.split('/');

  try {
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    return files.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.additions + file.deletions,
    }));
  } catch (error) {
    const githubError = new Error(`Failed to fetch PR files: ${error.message}`);
    githubError.code = 'GITHUB_API_ERROR';
    githubError.originalError = error;
    throw githubError;
  }
}

/**
 * Post comment to PR
 * @param {Object} octokit - Octokit instance
 * @param {string} repoFullName - Repository full name
 * @param {number} prNumber - PR number
 * @param {string} comment - Comment body (markdown)
 * @returns {Promise<Object>} Created comment
 */
async function postPRComment(octokit, repoFullName, prNumber, comment) {
  const [owner, repo] = repoFullName.split('/');

  try {
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    });

    return {
      id: data.id,
      url: data.html_url,
      createdAt: data.created_at,
    };
  } catch (error) {
    const githubError = new Error(`Failed to post PR comment: ${error.message}`);
    githubError.code = 'GITHUB_API_ERROR';
    githubError.originalError = error;
    throw githubError;
  }
}

module.exports = {
  fetchPRMetadata,
  fetchPRDiff,
  fetchPRFiles,
  postPRComment,
};

