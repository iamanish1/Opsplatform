/**
 * Review Service - Main orchestrator for PR review pipeline
 * Implements 10-step review process
 */

const githubApp = require('../utils/github-app');
const githubService = require('./review/github.service');
const staticService = require('./review/static.service');
const ciLogsService = require('./review/ciLogs.service');
const promptService = require('./review/prompt.service');
const llamaService = require('./review/llama.service');
const scoringService = require('./review/scoring.service');
const prReviewRepo = require('../repositories/prReview.repo');
const scoreRepo = require('../repositories/score.repo');
const submissionRepo = require('../repositories/submission.repo');

/**
 * Process PR review - 10-step pipeline
 * @param {Object} jobData - Job data from queue
 * @returns {Promise<Object>} Review result
 */
async function processPRReview(jobData) {
  const { submissionId, repoFullName, prNumber, installationId } = jobData;

  console.log(`[Review Service] Starting PR review for submission ${submissionId}, PR #${prNumber}`);

  // STEP 1: Validate job payload
  if (!submissionId || !repoFullName || !prNumber || !installationId) {
    throw new Error('Missing required fields: submissionId, repoFullName, prNumber, or installationId');
  }

  let octokit;
  let prMetadata;
  let diffData;
  let staticReport;
  let ciReport;
  let llmScores;
  let finalScores;

  try {
    // STEP 2: Generate GitHub Installation Token
    console.log(`[Review Service] Step 2: Generating GitHub installation token...`);
    octokit = await githubApp.getOctokit(installationId);
    console.log(`[Review Service] GitHub token obtained`);

    // STEP 3: Fetch PR Metadata
    console.log(`[Review Service] Step 3: Fetching PR metadata...`);
    prMetadata = await githubService.fetchPRMetadata(octokit, repoFullName, prNumber);
    console.log(`[Review Service] PR metadata fetched: ${prMetadata.title}`);

    // STEP 4: Fetch Diff + Changed Files
    console.log(`[Review Service] Step 4: Fetching PR diff and files...`);
    diffData = await githubService.fetchPRDiff(octokit, repoFullName, prNumber, 5, 1000);
    console.log(`[Review Service] Diff fetched: ${diffData.totalFiles} files, ${diffData.totalAdditions} additions, ${diffData.totalDeletions} deletions`);

    // STEP 5: Run Static Analysis
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
    console.log(`[Review Service] Step 6: Fetching CI/CD logs...`);
    ciReport = await ciLogsService.fetchCILogs(octokit, repoFullName, prNumber);
    console.log(`[Review Service] CI logs fetched: status = ${ciReport.ciStatus}`);

    // STEP 7: Build LLM Prompt
    console.log(`[Review Service] Step 7: Building LLM prompt...`);
    const prompt = promptService.buildPrompt(prMetadata, diffData, staticReport, ciReport);
    console.log(`[Review Service] Prompt built (${prompt.length} characters)`);

    // STEP 8: Run LLM (Llama 3)
    console.log(`[Review Service] Step 8: Calling Llama 3...`);
    llmScores = await llamaService.generateReview(prompt);
    console.log(`[Review Service] LLM review complete`);

    // STEP 9: Apply Fusion Scoring
    console.log(`[Review Service] Step 9: Applying fusion scoring rules...`);
    finalScores = scoringService.generateScore(llmScores, staticReport, ciReport, prMetadata);
    console.log(`[Review Service] Final scores: total = ${finalScores.totalScore}/100, badge = ${finalScores.badge}`);

    // STEP 10: Save PRReview & Score
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
      codeQuality: finalScores.codeQuality,
      problemSolving: finalScores.problemSolving,
      bugRisk: finalScores.bugRisk,
      devopsExecution: finalScores.devopsExecution,
      optimization: finalScores.optimization,
      documentation: finalScores.documentation,
      gitMaturity: finalScores.gitMaturity,
      collaboration: finalScores.collaboration,
      deliverySpeed: finalScores.deliverySpeed,
      security: finalScores.security,
      reliability: finalScores.reliability, // Legacy field
      totalScore: finalScores.totalScore,
      badge: finalScores.badge,
      detailsJson: finalScores.detailsJson,
    });
    console.log(`[Review Service] Score saved: ${score.id}`);

    // Update Submission status
    await submissionRepo.updateStatus(submissionId, 'REVIEWED');
    console.log(`[Review Service] Submission status updated to REVIEWED`);

    // Enqueue portfolio generation
    console.log(`[Review Service] Enqueueing portfolio generation...`);
    try {
      const portfolioQueue = require('../queues/portfolio.queue');
      await portfolioQueue.add('generate', {
        userId: submission.userId,
        submissionId: submission.id,
        scoreId: score.id,
      });
      console.log(`[Review Service] Portfolio generation job enqueued`);
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
