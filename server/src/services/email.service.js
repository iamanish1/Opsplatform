/**
 * Email Service
 * Handles sending emails via Resend API
 */

const config = require('../config');

// Initialize Resend client (handle case where package is not installed)
let Resend;
let resend = null;

try {
  Resend = require('resend').Resend;
  if (config.email.resendApiKey) {
    resend = new Resend(config.email.resendApiKey);
  }
} catch (error) {
  console.warn('[Email Service] Resend package not installed. Email functionality will be disabled.');
}

/**
 * Send email via Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @returns {Promise<Object>} Resend API response
 */
async function send(to, subject, htmlBody) {
  if (!resend) {
    console.warn('[Email Service] Resend API key not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  if (!to) {
    throw new Error('Recipient email is required');
  }

  try {
    const result = await resend.emails.send({
      from: `${config.email.fromName} <${config.email.fromEmail}>`,
      to,
      subject,
      html: htmlBody,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    throw error;
  }
}

/**
 * Generate HTML email template wrapper
 * @param {string} title - Email title
 * @param {string} content - Email content
 * @param {string} actionUrl - Optional action button URL
 * @param {string} actionText - Optional action button text
 * @returns {string} HTML email
 */
function generateEmailTemplate(title, content, actionUrl = null, actionText = null) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">DevHubs</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
        <div style="color: #4b5563; margin-bottom: 30px;">
          ${content}
        </div>
        ${actionUrl && actionText
          ? `<a href="${actionUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">${actionText}</a>`
          : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          This is an automated notification from DevHubs. You can manage your notification preferences in your account settings.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send score ready email
 * @param {Object} user - User object
 * @param {Object} submission - Submission object
 * @param {Object} score - Score object
 * @returns {Promise<Object>} Email send result
 */
async function sendScoreReadyEmail(user, submission, score) {
  const portfolioUrl = submission.portfolio
    ? `https://devhubs.com/u/${user.githubUsername || user.id}`
    : null;

  const content = `
    <p>Great news! Your PR has been reviewed and your Talent Assurance Score is ready.</p>
    <p><strong>Score:</strong> ${score.totalScore}/100</p>
    <p><strong>Badge:</strong> ${score.badge}</p>
    ${portfolioUrl
      ? `<p>Your portfolio has been generated and is now live!</p>`
      : `<p>Your portfolio will be generated shortly.</p>`
    }
  `;

  const html = generateEmailTemplate(
    'Your PR Review is Complete!',
    content,
    portfolioUrl,
    portfolioUrl ? 'View Portfolio' : null
  );

  return send(user.email, 'Your PR Review is Complete - DevHubs', html);
}

/**
 * Send portfolio ready email
 * @param {Object} user - User object
 * @param {Object} portfolio - Portfolio object
 * @returns {Promise<Object>} Email send result
 */
async function sendPortfolioReadyEmail(user, portfolio) {
  const portfolioUrl = `https://devhubs.com/u/${user.githubUsername || user.id}`;

  const content = `
    <p>Your professional portfolio is now live and ready to share!</p>
    <p>Showcase your DevOps skills to potential employers and recruiters.</p>
  `;

  const html = generateEmailTemplate(
    'Your Portfolio is Ready!',
    content,
    portfolioUrl,
    'View Portfolio'
  );

  return send(user.email, 'Your Portfolio is Ready - DevHubs', html);
}

/**
 * Send interview request email
 * @param {Object} developer - Developer user object
 * @param {Object} company - Company object
 * @param {Object} request - Interview request object
 * @returns {Promise<Object>} Email send result
 */
async function sendInterviewRequestEmail(developer, company, request) {
  const requestUrl = `https://devhubs.com/interview-requests/${request.id}`;

  const content = `
    <p><strong>${company.companyName}</strong> has requested an interview with you!</p>
    <p><strong>Position:</strong> ${request.position}</p>
    ${request.message ? `<p><strong>Message:</strong> ${request.message}</p>` : ''}
    <p>You can accept or reject this request from your dashboard.</p>
  `;

  const html = generateEmailTemplate(
    'New Interview Request',
    content,
    requestUrl,
    'View Request'
  );

  return send(developer.email, `Interview Request from ${company.companyName} - DevHubs`, html);
}

/**
 * Send interview accepted email
 * @param {Object} company - Company user object
 * @param {Object} developer - Developer user object
 * @param {Object} request - Interview request object
 * @returns {Promise<Object>} Email send result
 */
async function sendInterviewAcceptedEmail(company, developer, request) {
  const content = `
    <p><strong>${developer.name || developer.githubUsername}</strong> has accepted your interview request!</p>
    <p><strong>Position:</strong> ${request.position}</p>
    <p>You can now proceed with scheduling the interview.</p>
  `;

  const html = generateEmailTemplate(
    'Interview Request Accepted',
    content
  );

  return send(company.email, `Interview Accepted - ${developer.name || developer.githubUsername} - DevHubs`, html);
}

/**
 * Send interview rejected email
 * @param {Object} company - Company user object
 * @param {Object} developer - Developer user object
 * @param {Object} request - Interview request object
 * @returns {Promise<Object>} Email send result
 */
async function sendInterviewRejectedEmail(company, developer, request) {
  const content = `
    <p><strong>${developer.name || developer.githubUsername}</strong> has declined your interview request.</p>
    <p><strong>Position:</strong> ${request.position}</p>
    <p>Don't worry, there are many other talented developers on DevHubs!</p>
  `;

  const html = generateEmailTemplate(
    'Interview Request Declined',
    content
  );

  return send(company.email, `Interview Declined - ${developer.name || developer.githubUsername} - DevHubs`, html);
}

/**
 * Send GitHub app installed email
 * @param {Object} user - User object
 * @returns {Promise<Object>} Email send result
 */
async function sendGithubAppInstalledEmail(user) {
  const content = `
    <p>Your GitHub App has been successfully installed!</p>
    <p>You can now start submitting DevOps projects for review.</p>
  `;

  const html = generateEmailTemplate(
    'GitHub App Installed Successfully',
    content
  );

  return send(user.email, 'GitHub App Installed - DevHubs', html);
}

module.exports = {
  send,
  generateEmailTemplate,
  sendScoreReadyEmail,
  sendPortfolioReadyEmail,
  sendInterviewRequestEmail,
  sendInterviewAcceptedEmail,
  sendInterviewRejectedEmail,
  sendGithubAppInstalledEmail,
};

