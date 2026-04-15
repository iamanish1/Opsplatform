/**
 * Review Service - Main orchestrator for PR review pipeline
 * Implements 10-step review process
 */

const githubService = require('./review/github.service');
const staticService = require('./review/static.service');
const ciLogsService = require('./review/ciLogs.service');
const promptService = require('./review/prompt.service');
const llamaService = require('./review/llama.service');
const scoringService = require('./review/scoring.service');
const prReviewRepo = require('../repositories/prReview.repo');
const scoreRepo = require('../repositories/score.repo');
const submissionRepo = require('../repositories/submission.repo');
const reviewProgress = require('./reviewProgress.service');

function toScoreInt(value) {
  return Math.max(0, Math.min(10, Math.round(Number(value) || 0)));
}

/**
 * Process PR review - 10-step pipeline
 * @param {Object} jobData - Job data from queue
 * @returns {Promise<Object>} Review result
 */
async function processPRReview(jobData) {
  const { submissionId, repoFullName, prNumber, installationId, userToken } = jobData;

  console.log(`[Review Service] Starting PR review for submission ${submissionId}, PR #${prNumber}`);

  // STEP 1: Validate job payload
  if (!submissionId || !repoFullName || !prNumber || (!installationId && !userToken)) {
    throw new Error('Missing required fields: submissionId, repoFullName, prNumber, and either installationId or userToken');
  }

  const submission = await submissionRepo.findById(submissionId);
  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  let octokit;
  let prMetadata;
  let diffData;
  let staticReport;
  let ciReport;
  let llmScores;
  let finalScores;

  try {
    reviewProgress.start(submissionId, 'Preparing review');

    // STEP 2: Generate GitHub client
    reviewProgress.update(submissionId, 12, 'github-auth', 'Connecting to GitHub');
    console.log(`[Review Service] Step 2: Creating GitHub client...`);
    if (installationId) {
      const githubApp = require('../utils/github-app');
      octokit = await githubApp.getOctokit(installationId);
      console.log(`[Review Service] GitHub App token obtained`);
    } else {
      const { Octokit } = require('@octokit/rest');
      octokit = new Octokit({ auth: userToken });
      console.log(`[Review Service] GitHub OAuth token obtained`);
    }

    // STEP 3: Fetch PR Metadata
    reviewProgress.update(submissionId, 20, 'fetching-pr', 'Fetching PR metadata');
    console.log(`[Review Service] Step 3: Fetching PR metadata...`);
    prMetadata = await githubService.fetchPRMetadata(octokit, repoFullName, prNumber);
    console.log(`[Review Service] PR metadata fetched: ${prMetadata.title}`);

    // STEP 4: Fetch Diff + Changed Files
    reviewProgress.update(submissionId, 32, 'fetching-diff', 'Fetching changed files');
    console.log(`[Review Service] Step 4: Fetching PR diff and files...`);
    const maxFiles = parseInt(process.env.REVIEW_MAX_FILES || '3', 10);
    const maxLines = parseInt(process.env.REVIEW_MAX_LINES_PER_FILE || '250', 10);
    diffData = await githubService.fetchPRDiff(octokit, repoFullName, prNumber, maxFiles, maxLines);
    console.log(`[Review Service] Diff fetched: ${diffData.totalFiles} files, ${diffData.totalAdditions} additions, ${diffData.totalDeletions} deletions`);
    
    // Sanitize diff data before sending to LLM
    const { sanitizeFiles } = require('../utils/sanitize');
    diffData.files = sanitizeFiles(diffData.files);

    // STEP 5: Run Static Analysis
    reviewProgress.update(submissionId, 45, 'static-analysis', 'Running static analysis');
    console.log(`[Review Service] Step 5: Running static analysis...`);
    const prFiles = diffData.files.map((file) => ({
      filename: file.filename,
      patch: file.patch,
      additions: file.additions,
      deletions: file.deletions,
    }));

    // Merge PR metadata with diff data for static analysis
    const metadataForStatic = {
      ...prMetadata,
      additions: diffData.totalAdditions,
      deletions: diffData.totalDeletions,
      changedFiles: diffData.totalFiles,
    };

    staticReport = await staticService.runStaticAnalysis(prFiles, metadataForStatic);
    console.log(`[Review Service] Static analysis complete: ${staticReport.eslintErrors} ESLint errors, ${staticReport.securityAlertCount} security alerts`);

    // STEP 6: Fetch CI/CD Logs
    reviewProgress.update(submissionId, 56, 'ci-logs', 'Checking CI/CD status');
    console.log(`[Review Service] Step 6: Fetching CI/CD logs...`);
    ciReport = await ciLogsService.fetchCILogs(octokit, repoFullName, prNumber);
    console.log(`[Review Service] CI logs fetched: status = ${ciReport.ciStatus}`);

    // STEP 7: Build LLM Prompt
    reviewProgress.update(submissionId, 68, 'building-prompt', 'Building AI review prompt');
    console.log(`[Review Service] Step 7: Building LLM prompt...`);
    const prompt = promptService.buildPrompt(prMetadata, diffData, staticReport, ciReport);
    console.log(`[Review Service] Prompt built (${prompt.length} characters)`);

    // STEP 8: Run LLM (Llama 3)
    reviewProgress.update(submissionId, 78, 'ai-review', 'Running AI code review');
    console.log(`[Review Service] Step 8: Calling Llama 3...`);
    llmScores = await llamaService.generateReview(prompt);
    console.log(`[Review Service] LLM review complete`);

    // STEP 9: Apply Fusion Scoring
    reviewProgress.update(submissionId, 88, 'scoring', 'Computing review scores');
    console.log(`[Review Service] Step 9: Applying fusion scoring rules...`);
    finalScores = scoringService.generateScore(llmScores, staticReport, ciReport, prMetadata);
    console.log(`[Review Service] Final scores: total = ${finalScores.totalScore}/100, badge = ${finalScores.badge}`);

    // STEP 10: Save PRReview & Score
    reviewProgress.update(submissionId, 94, 'saving', 'Saving review results');
    console.log(`[Review Service] Step 10: Saving review and score to database...`);

    // Create PRReview record
    const prReview = await prReviewRepo.create({
      submissionId,
      prNumber,
      reviewJson: llmScores,
      staticReport: staticReport,
      suggestions: llmScores.suggestions || [],
    });
    console.log(`[Review Service] PRReview created: ${prReview.id}`);

    // Create/Update Score record with all 10 categories
    const score = await scoreRepo.createOrUpdate({
      submissionId,
      codeQuality: toScoreInt(finalScores.codeQuality),
      problemSolving: toScoreInt(finalScores.problemSolving),
      bugRisk: toScoreInt(finalScores.bugRisk),
      devopsExecution: toScoreInt(finalScores.devopsExecution),
      optimization: toScoreInt(finalScores.optimization),
      documentation: toScoreInt(finalScores.documentation),
      gitMaturity: toScoreInt(finalScores.gitMaturity),
      collaboration: toScoreInt(finalScores.collaboration),
      deliverySpeed: toScoreInt(finalScores.deliverySpeed),
      security: toScoreInt(finalScores.security),
      reliability: toScoreInt(finalScores.reliability), // Legacy field
      totalScore: Math.round(Number(finalScores.totalScore) || 0),
      badge: finalScores.badge,
      detailsJson: finalScores.detailsJson,
    });
    console.log(`[Review Service] Score saved: ${score.id}`);

    // Update Submission status
    await submissionRepo.updateStatus(submissionId, 'REVIEWED');
    reviewProgress.complete(submissionId);
    console.log(`[Review Service] Submission status updated to REVIEWED`);

    // Emit ScoreReady event
    try {
      const eventBus = require('../utils/eventBus');
      eventBus.emit('ScoreReady', {
        userId: submission.userId,
        submissionId: submission.id,
        scoreId: score.id,
      });
      console.log(`[Review Service] ScoreReady event emitted`);
    } catch (eventError) {
      console.warn(`[Review Service] Failed to emit ScoreReady event: ${eventError.message}`);
      // Don't fail the whole review if event emission fails
    }

    // Enqueue portfolio generation
    console.log(`[Review Service] Enqueueing portfolio generation...`);
    try {
      if (process.env.REDIS_DISABLED === 'true') {
        console.log(`[Review Service] Portfolio queue skipped because Redis is disabled`);
      } else {
        const portfolioQueue = require('../queues/portfolio.queue');
        await portfolioQueue.add('generate', {
          userId: submission.userId,
          submissionId: submission.id,
          scoreId: score.id,
        });
        console.log(`[Review Service] Portfolio generation job enqueued`);
      }
    } catch (portfolioError) {
      console.warn(`[Review Service] Failed to enqueue portfolio generation: ${portfolioError.message}`);
      // Don't fail the whole review if portfolio queue fails
    }

    // Post PR comment
    console.log(`[Review Service] Posting PR comment...`);
    const comment = generatePRComment(finalScores, llmScores, staticReport, ciReport);
    try {
      await githubService.postPRComment(octokit, repoFullName, prNumber, comment);
      console.log(`[Review Service] PR comment posted successfully`);
    } catch (commentError) {
      console.warn(`[Review Service] Failed to post PR comment: ${commentError.message}`);
      // Don't fail the whole review if comment fails
    }

    return {
      success: true,
      submissionId,
      prNumber,
      prReviewId: prReview.id,
      scoreId: score.id,
      totalScore: finalScores.totalScore,
      llmFallback: llmScores.fallback || false,
    };
  } catch (error) {
    reviewProgress.fail(submissionId, error);
    console.error(`[Review Service] Error in PR review pipeline:`, {
      error: error.message,
      stack: error.stack,
      submissionId,
      prNumber,
    });

    // If LLM failed but we have static analysis, save partial review
    if (staticReport && !llmScores) {
      console.log(`[Review Service] Saving partial review with static analysis only...`);
      try {
        await prReviewRepo.create({
          submissionId,
          prNumber,
          reviewJson: {
            summary: 'AI review unavailable. Static analysis completed.',
            error: error.message,
          },
          staticReport: staticReport,
          suggestions: [],
        });
      } catch (saveError) {
        console.error(`[Review Service] Failed to save partial review: ${saveError.message}`);
      }
    }

    throw error;
  }
}

/**
 * Generate PR comment from review results
 * @param {Object} finalScores - Final scores
 * @param {Object} llmScores - LLM scores
 * @param {Object} staticReport - Static analysis
 * @param {Object} ciReport - CI/CD report
 * @returns {string} Markdown comment
 */
function generatePRComment(finalScores, llmScores, staticReport, ciReport) {
  const totalScore = finalScores.totalScore;
  const summary = llmScores.summary || 'Review completed.';
  const suggestions = llmScores.suggestions || [];

  let comment = `## 🤖 DevHubs AI Review\n\n`;
  comment += `### Overall Score: **${totalScore}/100** (Badge: ${finalScores.badge})\n\n`;
  comment += `**Breakdown:**\n`;
  comment += `- Code Quality: ${finalScores.codeQuality}/10\n`;
  comment += `- Problem Solving: ${finalScores.problemSolving}/10\n`;
  comment += `- Bug Risk: ${finalScores.bugRisk}/10\n`;
  comment += `- DevOps Execution: ${finalScores.devopsExecution}/10\n`;
  comment += `- Optimization: ${finalScores.optimization}/10\n`;
  comment += `- Documentation: ${finalScores.documentation}/10\n`;
  comment += `- Git Maturity: ${finalScores.gitMaturity}/10\n`;
  comment += `- Collaboration: ${finalScores.collaboration}/10\n`;
  comment += `- Delivery Speed: ${finalScores.deliverySpeed}/10\n`;
  comment += `- Security: ${finalScores.security}/10\n\n`;

  comment += `### Key Findings:\n${summary}\n\n`;

  if (suggestions.length > 0) {
    comment += `### Suggestions:\n`;
    suggestions.forEach((suggestion, index) => {
      comment += `${index + 1}. ${suggestion}\n`;
    });
    comment += `\n`;
  }

  comment += `### Static Analysis:\n`;
  comment += `- ESLint: ${staticReport.eslintErrors} errors, ${staticReport.eslintWarnings} warnings\n`;
  comment += `- Security: ${staticReport.securityAlertCount} alerts found\n`;
  comment += `- CI/CD: ${ciReport.ciStatus}\n`;
  if (staticReport.dockerIssueCount > 0) {
    comment += `- Docker: ${staticReport.dockerIssueCount} issues\n`;
  }
  if (staticReport.yamlIssueCount > 0) {
    comment += `- YAML: ${staticReport.yamlIssueCount} validation errors\n`;
  }

  comment += `\n---\n*This review was generated by DevHubs AI Review Engine*\n`;

  return comment;
}

module.exports = {
  processPRReview,
};
