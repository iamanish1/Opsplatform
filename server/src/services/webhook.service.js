const submissionRepo = require('../repositories/submission.repo');
const userRepo = require('../repositories/user.repo');
const authService = require('./auth.service');
const reviewQueue = require('../queues/review.queue');

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
    console.warn(`Multiple submissions found for repo ${repoUrl}, using PR author as tiebreaker`);
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
      console.log(`Enqueued review job: ${job.id} for submission ${jobPayload.submissionId}`);
      return job.id;
    })
    .catch((error) => {
      console.error('Failed to enqueue review job:', error);
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
    console.log(`Skipping pull_request event with action: ${action}`);
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
  
  console.log(`Processing pull_request event: ${action} for PR #${prNumber} in ${repoFullName}`);
  
  // Map PR to submission
  const submission = await mapSubmissionToPR(repoUrl, prAuthorGithubId);
  
  if (!submission) {
    console.warn(`No submission found for PR #${prNumber} in repo ${repoUrl}`);
    return {
      processed: false,
      reason: 'No submission found for this repository',
    };
  }
  
  // Update submission with PR number and status
  const shouldUpdateStatus = action === 'opened' || action === 'reopened';
  
  if (shouldUpdateStatus || !submission.prNumber) {
    await submissionRepo.attachPR(submission.id, prNumber);
    console.log(`Updated submission ${submission.id} with PR #${prNumber}`);
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
  
  console.log(`Processing workflow_run event: ${conclusion} for ${repoFullName}`);
  
  // Find associated PR number
  if (pullRequests.length === 0) {
    console.log('No associated PRs found for workflow_run event');
    return {
      processed: false,
      reason: 'No associated PRs',
    };
  }
  
  const prNumber = pullRequests[0].number;
  
  // Find submission by PR number
  const submission = await submissionRepo.findByPRNumber(prNumber);
  
  if (!submission) {
    console.warn(`No submission found for workflow_run with PR #${prNumber} in repo ${repoUrl}`);
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
    
    console.log(`Processing installation.created: ${installationId} for GitHub user ${senderGithubId}`);
    
    // Use existing auth service method
    await authService.handleInstallationCreated(installation);
    
    return {
      processed: true,
      installationId: installationId,
      githubUserId: senderGithubId,
    };
  } else if (action === 'deleted') {
    const installationId = String(installation.id);
    
    console.log(`Processing installation.deleted: ${installationId}`);
    
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

