const submissionRepo = require('../repositories/submission.repo');
const userRepo = require('../repositories/user.repo');
const authService = require('./auth.service');
const reviewQueue = require('../queues/review.queue');
const logger = require('../utils/logger');

/**
 * Map PR event to submission
 * @param {string} repoUrl - Repository URL from GitHub event
 * @param {string} prAuthorGithubId - PR author's GitHub ID
 * @returns {Promise<Object|null>} Submission or null
 */
async function mapSubmissionToPR(repoUrl, prAuthorGithubId) {
  // First try exact match with user GitHub ID (most precise)
  let submission = await submissionRepo.findByRepoUrlAndUser(repoUrl, prAuthorGithubId);
  
  if (submission) {
    return submission;
  }
  
  // Fallback to exact repo URL match
  submission = await submissionRepo.findByRepoUrl(repoUrl);
  
  if (submission) {
    // Verify PR author matches submission user
    if (submission.user && submission.user.githubId === prAuthorGithubId) {
      return submission;
    }
    
    // If multiple submissions with same repo but different users, log warning
    logger.warn({ repoUrl, prAuthorGithubId }, 'Multiple submissions found for repo, using PR author as tiebreaker');
  }
  
  return null;
}

/**
 * Enqueue review job to queue (fire-and-forget)
 * @param {Object} jobPayload - Job payload data
 * @returns {Promise<string|null>} Job ID or null if failed
 */
async function enqueueReviewJob(jobPayload) {
  // Fire-and-forget: don't await, just log result
  reviewQueue.add('review', jobPayload, {
    jobId: `${jobPayload.submissionId}-${jobPayload.prNumber}-${Date.now()}`,
  })
    .then((job) => {
      logger.info({ jobId: job.id, submissionId: jobPayload.submissionId }, 'Enqueued review job');
      return job.id;
    })
    .catch((error) => {
      logger.error({ error: error.message, stack: error.stack }, 'Failed to enqueue review job');
      return null;
    });
  
  // Return immediately (fire-and-forget)
  return null;
}

/**
 * Handle pull_request webhook events
 * @param {Object} payload - GitHub webhook payload
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} Processing result
 */
async function handlePullRequest(payload, headers) {
  const action = payload.action;
  const pr = payload.pull_request;
  const repo = payload.repository;
  const installationId = payload.installation?.id;
  
  // Only process specific actions
  if (!['opened', 'reopened', 'synchronize'].includes(action)) {
    logger.info({ action }, 'Skipping pull_request event');
    return {
      processed: false,
      reason: `Action ${action} not processed`,
    };
  }

  // Extract data from payload
  const repoUrl = repo.html_url;
  const prNumber = pr.number;
  const prAuthorGithubId = String(pr.user.id);
  const repoFullName = repo.full_name;
  
  logger.info({ action, prNumber, repoFullName }, 'Processing pull_request event');
  
  // Map PR to submission
  const submission = await mapSubmissionToPR(repoUrl, prAuthorGithubId);
  
  if (!submission) {
    logger.warn({ prNumber, repoUrl }, 'No submission found for PR');
    return {
      processed: false,
      reason: 'No submission found for this repository',
    };
  }

  // Update submission with PR number and status
  const shouldUpdateStatus = action === 'opened' || action === 'reopened';
  
  if (shouldUpdateStatus || !submission.prNumber) {
    await submissionRepo.attachPR(submission.id, prNumber);
    logger.info({ submissionId: submission.id, prNumber }, 'Updated submission with PR number');
  }
  
  // Enqueue review job (fire-and-forget)
  const jobPayload = {
    submissionId: submission.id,
    repoFullName: repoFullName,
    prNumber: prNumber,
    installationId: installationId ? String(installationId) : null,
    event: 'pull_request',
    action: action,
  };
  
  enqueueReviewJob(jobPayload); // Fire-and-forget
  
  return {
    processed: true,
    submissionId: submission.id,
    prNumber: prNumber,
  };
}

/**
 * Handle workflow_run webhook events
 * @param {Object} payload - GitHub webhook payload
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} Processing result
 */
async function handleWorkflowRun(payload, headers) {
  const workflowRun = payload.workflow_run;
  const repo = payload.repository;
  const installationId = payload.installation?.id;
  
  // Extract data
  const conclusion = workflowRun.conclusion; // success, failure, cancelled, etc.
  const logsUrl = workflowRun.logs_url;
  const pullRequests = workflowRun.pull_requests || [];
  const repoFullName = repo.full_name;
  const repoUrl = repo.html_url;
  
  logger.info({ conclusion, repoFullName }, 'Processing workflow_run event');
  
  // Find associated PR number
  if (pullRequests.length === 0) {
    logger.info({ repoFullName }, 'No associated PRs found for workflow_run event');
    return {
      processed: false,
      reason: 'No associated PRs',
    };
  }
  
  const prNumber = pullRequests[0].number;
  
  // Find submission by PR number
  const submission = await submissionRepo.findByPRNumber(prNumber);
  
  if (!submission) {
    logger.warn({ prNumber, repoUrl }, 'No submission found for workflow_run');
    return {
      processed: false,
      reason: 'No matching submission found',
    };
  }
  
  // Enqueue job for CI/CD analysis (fire-and-forget)
  const jobPayload = {
    submissionId: submission.id,
    repoFullName: repoFullName,
    prNumber: prNumber,
    installationId: installationId ? String(installationId) : null,
    event: 'workflow_run',
    conclusion: conclusion,
    logsUrl: logsUrl,
  };
  
  enqueueReviewJob(jobPayload); // Fire-and-forget
  
  return {
    processed: true,
    submissionId: submission.id,
    prNumber: prNumber,
  };
}

/**
 * Handle installation webhook events
 * @param {Object} payload - GitHub webhook payload
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} Processing result
 */
async function handleInstallation(payload, headers) {
  const action = payload.action;
  const installation = payload.installation;
  const sender = payload.sender;
  
  if (action === 'created') {
    const installationId = String(installation.id);
    const senderGithubId = String(sender.id);
    
    logger.info({ installationId, senderGithubId }, 'Processing installation.created');
    
    // Use existing auth service method
    await authService.handleInstallationCreated(installation);
    
    return {
      processed: true,
      installationId: installationId,
      githubUserId: senderGithubId,
    };
  } else if (action === 'deleted') {
    const installationId = String(installation.id);
    
    logger.info({ installationId }, 'Processing installation.deleted');
    
    await authService.handleInstallationDeleted(installationId);
    
    return {
      processed: true,
      installationId: installationId,
    };
  }
  
  return {
    processed: false,
    reason: `Action ${action} not handled`,
  };
}

module.exports = {
  handlePullRequest,
  handleWorkflowRun,
  handleInstallation,
  mapSubmissionToPR,
  enqueueReviewJob,
};

