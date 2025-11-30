/**
 * Notification Worker
 * Processes notification jobs from the queue
 */

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const notificationRepo = require('../repositories/notification.repo');
const notificationPreferencesRepo = require('../repositories/notificationPreferences.repo');
const emailService = require('../services/email.service');
const userRepo = require('../repositories/user.repo');
const submissionRepo = require('../repositories/submission.repo');
const scoreRepo = require('../repositories/score.repo');
const portfolioRepo = require('../repositories/portfolio.repo');
const companyRepo = require('../repositories/company.repo');
const interviewRequestRepo = require('../repositories/interviewRequest.repo');

// Concurrency: 3 (can be overridden with QUEUE_CONCURRENCY_NOTIFICATION env var)
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY_NOTIFICATION || '3', 10);

const worker = new Worker(
  'notificationQueue',
  async (job) => {
    const { eventType, data } = job.data;

    console.log(`[Notification Worker] Processing job ${job.id}:`, { eventType, data });

    try {
      // Handle different event types
      switch (eventType) {
        case 'ScoreReady':
          await handleScoreReady(data);
          break;
        case 'PortfolioReady':
          await handlePortfolioReady(data);
          break;
        case 'InterviewRequested':
          await handleInterviewRequested(data);
          break;
        case 'InterviewAccepted':
          await handleInterviewAccepted(data);
          break;
        case 'InterviewRejected':
          await handleInterviewRejected(data);
          break;
        case 'GithubAppInstalled':
          await handleGithubAppInstalled(data);
          break;
        case 'CompanySignup':
          await handleCompanySignup(data);
          break;
        default:
          console.warn(`[Notification Worker] Unknown event type: ${eventType}`);
      }

      return { success: true, eventType };
    } catch (error) {
      console.error(`[Notification Worker] Error processing job ${job.id}:`, {
        error: error.message,
        stack: error.stack,
        eventType,
      });
      // Re-throw to let BullMQ handle retry
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: concurrency,
  }
);

/**
 * Handle ScoreReady event
 */
async function handleScoreReady(data) {
  const { userId, submissionId, scoreId } = data;

  // Fetch user, submission, and score
  const [user, submission, score] = await Promise.all([
    userRepo.findById(userId),
    submissionRepo.findById(submissionId),
    scoreRepo.findById(scoreId),
  ]);

  if (!user || !submission || !score) {
    throw new Error('Missing data for ScoreReady notification');
  }

  // Create notification
  const notification = await notificationRepo.create({
    userId,
    type: 'SCORE_READY',
    title: 'Your PR Review is Complete!',
    message: `Your submission has been reviewed. Your Talent Assurance Score is ${score.totalScore}/100 (${score.badge} badge).`,
    data: {
      submissionId,
      scoreId,
      totalScore: score.totalScore,
      badge: score.badge,
    },
  });

  // Check if email should be sent
  const shouldSend = await notificationPreferencesRepo.shouldSendEmail(userId, 'SCORE_READY');

  if (shouldSend && user.email) {
    try {
      await emailService.sendScoreReadyEmail(user, submission, score);
      await notificationRepo.updateEmailSent(notification.id);
    } catch (emailError) {
      console.error('[Notification Worker] Failed to send email:', emailError);
      // Don't fail the job if email fails
    }
  }
}

/**
 * Handle PortfolioReady event
 */
async function handlePortfolioReady(data) {
  const { userId, submissionId, portfolioId } = data;

  // Fetch user and portfolio
  const [user, portfolio] = await Promise.all([
    userRepo.findById(userId),
    portfolioRepo.findById(portfolioId),
  ]);

  if (!user || !portfolio) {
    throw new Error('Missing data for PortfolioReady notification');
  }

  // Create notification
  const notification = await notificationRepo.create({
    userId,
    type: 'PORTFOLIO_READY',
    title: 'Your Portfolio is Ready!',
    message: 'Your professional portfolio has been generated and is now live. Share it with potential employers!',
    data: {
      submissionId,
      portfolioId,
      slug: portfolio.slug,
    },
  });

  // Check if email should be sent
  const shouldSend = await notificationPreferencesRepo.shouldSendEmail(userId, 'PORTFOLIO_READY');

  if (shouldSend && user.email) {
    try {
      await emailService.sendPortfolioReadyEmail(user, portfolio);
      await notificationRepo.updateEmailSent(notification.id);
    } catch (emailError) {
      console.error('[Notification Worker] Failed to send email:', emailError);
    }
  }
}

/**
 * Handle InterviewRequested event
 */
async function handleInterviewRequested(data) {
  const { developerId, companyId, requestId } = data;

  // Fetch developer, company, and request
  const [developer, company, request] = await Promise.all([
    userRepo.findById(developerId),
    companyRepo.findById(companyId),
    interviewRequestRepo.findById(requestId),
  ]);

  if (!developer || !company || !request) {
    throw new Error('Missing data for InterviewRequested notification');
  }

  // Create notification for developer
  const notification = await notificationRepo.create({
    userId: developerId,
    type: 'INTERVIEW_REQUESTED',
    title: 'New Interview Request',
    message: `${company.companyName} has requested an interview for the position: ${request.position}`,
    data: {
      requestId,
      companyId,
      companyName: company.companyName,
      position: request.position,
    },
  });

  // Check if email should be sent
  const shouldSend = await notificationPreferencesRepo.shouldSendEmail(developerId, 'INTERVIEW_REQUESTED');

  if (shouldSend && developer.email) {
    try {
      await emailService.sendInterviewRequestEmail(developer, company, request);
      await notificationRepo.updateEmailSent(notification.id);
    } catch (emailError) {
      console.error('[Notification Worker] Failed to send email:', emailError);
    }
  }
}

/**
 * Handle InterviewAccepted event
 */
async function handleInterviewAccepted(data) {
  const { companyId, developerId, requestId } = data;

  // Fetch company, developer, and request
  const [company, developer, request] = await Promise.all([
    companyRepo.findById(companyId),
    userRepo.findById(developerId),
    interviewRequestRepo.findById(requestId),
  ]);

  if (!company || !developer || !request) {
    throw new Error('Missing data for InterviewAccepted notification');
  }

  // Get company user
  const companyUser = await userRepo.findById(company.userId);
  if (!companyUser) {
    throw new Error('Company user not found');
  }

  // Create notification for company
  const notification = await notificationRepo.create({
    userId: company.userId,
    type: 'INTERVIEW_ACCEPTED',
    title: 'Interview Request Accepted',
    message: `${developer.name || developer.githubUsername} has accepted your interview request for ${request.position}`,
    data: {
      requestId,
      developerId,
      developerName: developer.name || developer.githubUsername,
      position: request.position,
    },
  });

  // Check if email should be sent
  const shouldSend = await notificationPreferencesRepo.shouldSendEmail(company.userId, 'INTERVIEW_ACCEPTED');

  if (shouldSend && companyUser.email) {
    try {
      await emailService.sendInterviewAcceptedEmail(companyUser, developer, request);
      await notificationRepo.updateEmailSent(notification.id);
    } catch (emailError) {
      console.error('[Notification Worker] Failed to send email:', emailError);
    }
  }
}

/**
 * Handle InterviewRejected event
 */
async function handleInterviewRejected(data) {
  const { companyId, developerId, requestId } = data;

  // Fetch company, developer, and request
  const [company, developer, request] = await Promise.all([
    companyRepo.findById(companyId),
    userRepo.findById(developerId),
    interviewRequestRepo.findById(requestId),
  ]);

  if (!company || !developer || !request) {
    throw new Error('Missing data for InterviewRejected notification');
  }

  // Get company user
  const companyUser = await userRepo.findById(company.userId);
  if (!companyUser) {
    throw new Error('Company user not found');
  }

  // Create notification for company
  const notification = await notificationRepo.create({
    userId: company.userId,
    type: 'INTERVIEW_REJECTED',
    title: 'Interview Request Declined',
    message: `${developer.name || developer.githubUsername} has declined your interview request for ${request.position}`,
    data: {
      requestId,
      developerId,
      developerName: developer.name || developer.githubUsername,
      position: request.position,
    },
  });

  // Check if email should be sent
  const shouldSend = await notificationPreferencesRepo.shouldSendEmail(company.userId, 'INTERVIEW_REJECTED');

  if (shouldSend && companyUser.email) {
    try {
      await emailService.sendInterviewRejectedEmail(companyUser, developer, request);
      await notificationRepo.updateEmailSent(notification.id);
    } catch (emailError) {
      console.error('[Notification Worker] Failed to send email:', emailError);
    }
  }
}

/**
 * Handle GithubAppInstalled event
 */
async function handleGithubAppInstalled(data) {
  const { userId, installationId } = data;

  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error('User not found for GithubAppInstalled notification');
  }

  // Create notification
  const notification = await notificationRepo.create({
    userId,
    type: 'GITHUB_APP_INSTALLED',
    title: 'GitHub App Installed Successfully',
    message: 'Your GitHub App has been installed. You can now start submitting DevOps projects!',
    data: {
      installationId,
    },
  });

  // Check if email should be sent
  const shouldSend = await notificationPreferencesRepo.shouldSendEmail(userId, 'GITHUB_APP_INSTALLED');

  if (shouldSend && user.email) {
    try {
      await emailService.sendGithubAppInstalledEmail(user);
      await notificationRepo.updateEmailSent(notification.id);
    } catch (emailError) {
      console.error('[Notification Worker] Failed to send email:', emailError);
    }
  }
}

/**
 * Handle CompanySignup event (optional - for admin notifications)
 */
async function handleCompanySignup(data) {
  const { companyId, userId } = data;

  // For now, we'll just log it
  // In the future, you could notify admins
  console.log(`[Notification Worker] New company signup: ${companyId}, user: ${userId}`);
}

// Event listeners
worker.on('completed', (job) => {
  console.log(`[Notification Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Notification Worker] Job ${job.id} failed:`, {
    error: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    eventType: job.data?.eventType,
  });
});

worker.on('error', (err) => {
  console.error('[Notification Worker] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`[Notification Worker] Job ${jobId} stalled`);
});

console.log(`[Notification Worker] Started with concurrency: ${concurrency}`);

module.exports = worker;

