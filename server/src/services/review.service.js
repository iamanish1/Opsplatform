/**
 * Review Service — main orchestrator for the PR review pipeline.
 *
 * Pipeline (12 steps):
 *   1.  Validate job payload
 *   2.  GitHub auth
 *   3.  Fetch PR metadata
 *   4.  Fetch PR diff
 *   5.  Static analysis (extended: ESLint, Docker, YAML, secrets, complexity, dep audit)
 *   6.  Fetch CI/CD logs
 *   7.  Dispatch eval job to VPS3 (Docker build + hidden tests) — non-blocking
 *   8.  Build LLM prompt
 *   9.  Run LLM (Groq)
 *   10. Await eval result from VPS3 (with timeout)
 *   11. Fusion scoring + verification tier gates
 *   12. Save PRReview + Score, update submission, emit events
 */

const githubService = require('./review/github.service');
const staticService = require('./review/static.service');
const ciLogsService = require('./review/ciLogs.service');
const promptService = require('./review/prompt.service');
const llamaService = require('./review/llama.service');
const scoringService = require('./review/scoring.service');
const PipelineContext = require('./review/pipelineContext');
const prReviewRepo = require('../repositories/prReview.repo');
const scoreRepo = require('../repositories/score.repo');
const submissionRepo = require('../repositories/submission.repo');
const reviewProgress = require('./reviewProgress.service');
const logger = require('../utils/logger');

const EVAL_AWAIT_TIMEOUT_MS = parseInt(process.env.EVAL_AWAIT_TIMEOUT_MS || '120000', 10);
const EVAL_RESULT_CHANNEL = 'devhubs:eval:results';

function toScoreInt(value) {
  return Math.max(0, Math.min(10, Math.round(Number(value) || 0)));
}

/**
 * Wait for eval result from VPS3 via Redis pub/sub.
 * Returns null if no result arrives within EVAL_AWAIT_TIMEOUT_MS.
 * @param {string} submissionId
 * @returns {Promise<Object|null>}
 */
async function awaitEvalResult(submissionId) {
  // Only attempt if Redis is available
  if (process.env.REDIS_DISABLED === 'true') return null;

  try {
    const redis = require('../config/redis');
    const subscriber = redis.duplicate();
    await subscriber.subscribe(EVAL_RESULT_CHANNEL);

    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        subscriber.unsubscribe().catch(() => {});
        subscriber.disconnect();
        resolve(null); // Timeout — degrade gracefully
      }, EVAL_AWAIT_TIMEOUT_MS);

      subscriber.on('message', (_channel, message) => {
        try {
          const payload = JSON.parse(message);
          if (payload.submissionId === submissionId) {
            clearTimeout(timer);
            subscriber.unsubscribe().catch(() => {});
            subscriber.disconnect();
            resolve(payload.result);
          }
        } catch (_) {
          // Ignore malformed messages
        }
      });
    });
  } catch (err) {
    logger.warn({ submissionId, error: err.message }, '[Review] awaitEvalResult failed — degrading gracefully');
    return null;
  }
}

/**
 * Process PR review — 12-step pipeline.
 * @param {Object} jobData - BullMQ job data
 * @returns {Promise<Object>} Review result
 */
async function processPRReview(jobData) {
  const { submissionId, repoFullName, prNumber, installationId, userToken } = jobData;

  logger.info({ submissionId, prNumber }, '[Review] Starting PR review pipeline');

  // STEP 1: Validate
  if (!submissionId || !repoFullName || !prNumber || (!installationId && !userToken)) {
    throw new Error('Missing required fields: submissionId, repoFullName, prNumber, and either installationId or userToken');
  }

  const submission = await submissionRepo.findById(submissionId);
  if (!submission) throw new Error(`Submission not found: ${submissionId}`);

  // Fetch project info for hidden test config
  let project = null;
  try {
    const projectRepo = require('../repositories/project.repo');
    project = await projectRepo.findById(submission.projectId);
  } catch (_) { /* project info is optional */ }

  const ctx = new PipelineContext(submission);
  ctx.github.repoFullName = repoFullName;
  ctx.github.prNumber = prNumber;
  ctx.github.installationId = installationId;

  try {
    reviewProgress.start(submissionId, 'Preparing review');

    // STEP 2: GitHub auth
    reviewProgress.update(submissionId, 10, 'github-auth', 'Connecting to GitHub');
    ctx.startTimer('github-auth');
    if (installationId) {
      const githubApp = require('../utils/github-app');
      ctx.github.octokit = await githubApp.getOctokit(installationId);
    } else {
      const { Octokit } = require('@octokit/rest');
      ctx.github.octokit = new Octokit({ auth: userToken });
    }
    ctx.endTimer('github-auth');

    // STEP 3: PR metadata
    reviewProgress.update(submissionId, 18, 'fetching-pr', 'Fetching PR metadata');
    ctx.startTimer('pr-metadata');
    ctx.pr.metadata = await githubService.fetchPRMetadata(ctx.github.octokit, repoFullName, prNumber);
    ctx.endTimer('pr-metadata');
    logger.info({ submissionId, title: ctx.pr.metadata.title }, '[Review] PR metadata fetched');

    // STEP 4: PR diff
    reviewProgress.update(submissionId, 28, 'fetching-diff', 'Fetching changed files');
    ctx.startTimer('pr-diff');
    const maxFiles = parseInt(process.env.REVIEW_MAX_FILES || '3', 10);
    const maxLines = parseInt(process.env.REVIEW_MAX_LINES_PER_FILE || '250', 10);
    ctx.pr.diff = await githubService.fetchPRDiff(ctx.github.octokit, repoFullName, prNumber, maxFiles, maxLines);

    // Sanitize diff before LLM
    const { sanitizeFiles } = require('../utils/sanitize');
    ctx.pr.diff.files = sanitizeFiles(ctx.pr.diff.files).map((file) => ({
      ...file,
      patch: typeof file.patch === 'string'
        ? file.patch.slice(0, parseInt(process.env.REVIEW_MAX_PATCH_CHARS || '8000', 10))
        : file.patch,
    }));
    ctx.endTimer('pr-diff');

    // STEP 5: Static analysis (extended)
    reviewProgress.update(submissionId, 40, 'static-analysis', 'Running static analysis');
    ctx.startTimer('static-analysis');
    const prFiles = ctx.pr.diff.files.map((f) => ({
      filename: f.filename,
      patch: f.patch,
      additions: f.additions,
      deletions: f.deletions,
    }));
    const metadataForStatic = {
      ...ctx.pr.metadata,
      additions: ctx.pr.diff.totalAdditions,
      deletions: ctx.pr.diff.totalDeletions,
      changedFiles: ctx.pr.diff.totalFiles,
    };
    const staticReport = await staticService.runStaticAnalysis(prFiles, metadataForStatic);
    Object.assign(ctx.staticAnalysis, staticReport);
    ctx.endTimer('static-analysis');
    logger.info({
      submissionId,
      eslintErrors: ctx.staticAnalysis.eslintErrors,
      securityAlertCount: ctx.staticAnalysis.securityAlertCount,
      criticalVulns: ctx.staticAnalysis.criticalVulns,
    }, '[Review] Static analysis complete');

    // STEP 6: CI/CD logs
    reviewProgress.update(submissionId, 50, 'ci-logs', 'Checking CI/CD status');
    ctx.startTimer('ci-logs');
    ctx.ci = await ciLogsService.fetchCILogs(ctx.github.octokit, repoFullName, prNumber);
    ctx.endTimer('ci-logs');

    // Re-run coverage extraction with CI log content (if available)
    if (ctx.ci && ctx.ci.rawLog) {
      const { coveragePercent, coverageFound } = staticService.runTestCoverageExtract(ctx.ci.rawLog);
      if (coverageFound) {
        ctx.staticAnalysis.coveragePercent = coveragePercent;
        ctx.staticAnalysis.coverageFound = true;
      }
    }

    // STEP 7: Dispatch eval job to VPS3 (non-blocking dispatch, await later)
    let evalPromise = null;
    if (process.env.REDIS_DISABLED !== 'true' && process.env.EVAL_DISABLED !== 'true') {
      try {
        const evalQueue = require('../queues/eval.queue');
        const repoUrl = submission.repoUrl || `https://github.com/${repoFullName}`;
        await evalQueue.add('eval', {
          submissionId,
          repoUrl,
          projectSlug: project?.slug || null,
          hasHiddenTests: Boolean(project?.hasHiddenTests),
        }, {
          jobId: `eval-${submissionId}-${Date.now()}`,
        });
        ctx.execution.dispatched = true;
        // Start awaiting BEFORE we do the LLM call (which takes ~10-30s)
        evalPromise = awaitEvalResult(submissionId);
        logger.info({ submissionId }, '[Review] Eval job dispatched to VPS3');
      } catch (evalDispatchErr) {
        ctx.recordError('eval-dispatch', evalDispatchErr);
        logger.warn({ submissionId, error: evalDispatchErr.message }, '[Review] Eval dispatch failed — continuing without execution evidence');
      }
    }

    // STEP 8: Build LLM prompt
    reviewProgress.update(submissionId, 60, 'building-prompt', 'Building AI review prompt');
    ctx.startTimer('build-prompt');
    let prompt;
    try {
      prompt = promptService.buildPrompt(ctx.pr.metadata, ctx.pr.diff, ctx.staticAnalysis, ctx.ci);
    } catch (promptError) {
      prompt = promptService.buildCompactPrompt(ctx.pr.metadata, ctx.pr.diff, ctx.staticAnalysis, ctx.ci);
    }
    const maxPromptChars = parseInt(process.env.REVIEW_MAX_PROMPT_CHARS || '7000', 10);
    if (prompt.length > maxPromptChars) {
      prompt = `${prompt.slice(0, maxPromptChars)}\n... [truncated]\nReturn compact JSON only.`;
    }
    ctx.endTimer('build-prompt');

    // STEP 9: LLM review
    reviewProgress.update(submissionId, 68, 'ai-review', 'Running AI code review');
    ctx.startTimer('llm');
    const llmResult = await llamaService.generateReview(prompt);
    ctx.llmNarrative.raw = llmResult;
    ctx.llmNarrative.scores = llmResult;
    ctx.llmNarrative.summary = llmResult.summary;
    ctx.llmNarrative.suggestions = llmResult.suggestions || [];
    ctx.llmNarrative.fallback = llmResult.fallback || false;
    ctx.endTimer('llm');
    logger.info({ submissionId, fallback: ctx.llmNarrative.fallback }, '[Review] LLM review complete');

    // STEP 10: Await eval result from VPS3
    reviewProgress.update(submissionId, 80, 'awaiting-eval', 'Awaiting execution evidence');
    if (evalPromise) {
      ctx.startTimer('eval-await');
      const evalResult = await evalPromise;
      ctx.endTimer('eval-await');

      if (evalResult) {
        Object.assign(ctx.execution, evalResult);
        logger.info({
          submissionId,
          dockerBuildSuccess: ctx.execution.dockerBuildSuccess,
          hiddenTestPassRate: ctx.execution.hiddenTestPassRate,
          timedOut: ctx.execution.timedOut,
        }, '[Review] Eval result received from VPS3');
      } else {
        ctx.execution.timedOut = true;
        ctx.recordError('eval-await', new Error('Eval result timed out'));
        logger.warn({ submissionId }, '[Review] Eval result timed out — scoring without execution evidence');
      }
    }

    // STEP 11: Fusion scoring + verification tier
    reviewProgress.update(submissionId, 88, 'scoring', 'Computing verification score');
    ctx.startTimer('scoring');
    const executionResult = ctx.hasExecutionEvidence() ? ctx.execution : null;
    const finalScores = scoringService.generateScore(
      ctx.llmNarrative.scores,
      ctx.staticAnalysis,
      ctx.ci,
      ctx.pr.metadata,
      executionResult,
      null // reflectionCtx — Phase 3, not yet available at review time
    );
    ctx.scores.final = finalScores;
    ctx.scores.totalScore = finalScores.totalScore;
    ctx.scores.badge = finalScores.badge;
    ctx.scores.verificationTier = finalScores.verificationTier;
    ctx.scores.gateResults = finalScores.gateResults;
    ctx.scores.appliedRules = finalScores.detailsJson.raw.rulesApplied || [];
    ctx.endTimer('scoring');
    logger.info({
      submissionId,
      totalScore: finalScores.totalScore,
      badge: finalScores.badge,
      tier: finalScores.verificationTier,
    }, '[Review] Scoring complete');

    // STEP 11b: Competency mapping (Phase 4)
    let competencyResult = null;
    try {
      const competencyService = require('./review/competency.service');
      competencyResult = competencyService.mapCompetency({
        fusedScores: finalScores,
        staticReport: ctx.staticAnalysis,
        executionResult: executionResult || null,
        reflectionScore: null, // Not available yet at review time (Phase 3 fills this later)
        project,
      });
      ctx.competency = competencyResult;
      logger.info({ submissionId, level: competencyResult.level, domain: competencyResult.domain }, '[Review] Competency mapped');
    } catch (compErr) {
      logger.warn({ submissionId, error: compErr.message }, '[Review] Competency mapping failed');
    }

    // STEP 12: Persist results
    reviewProgress.update(submissionId, 94, 'saving', 'Saving review results');

    const prReview = await prReviewRepo.create({
      submissionId,
      prNumber,
      reviewJson: ctx.llmNarrative.raw,
      staticReport: ctx.staticAnalysis,
      suggestions: ctx.llmNarrative.suggestions,
    });

    const score = await scoreRepo.createOrUpdate({
      submissionId,
      codeQuality:     toScoreInt(finalScores.codeQuality),
      problemSolving:  toScoreInt(finalScores.problemSolving),
      bugRisk:         toScoreInt(finalScores.bugRisk),
      devopsExecution: toScoreInt(finalScores.devopsExecution),
      optimization:    toScoreInt(finalScores.optimization),
      documentation:   toScoreInt(finalScores.documentation),
      gitMaturity:     toScoreInt(finalScores.gitMaturity),
      collaboration:   toScoreInt(finalScores.collaboration),
      deliverySpeed:   toScoreInt(finalScores.deliverySpeed),
      security:        toScoreInt(finalScores.security),
      reliability:     toScoreInt(finalScores.reliability),
      totalScore:      Math.round(Number(finalScores.totalScore) || 0),
      badge:           finalScores.badge,
      detailsJson:     finalScores.detailsJson,
      // New verification engine fields
      verificationTier:     finalScores.verificationTier || 'NOT_VERIFIED',
      dockerBuildSuccess:   ctx.execution.dockerBuildSuccess ?? null,
      dockerBuildDurationMs: ctx.execution.dockerBuildDurationMs ?? null,
      hiddenTestPassRate:   ctx.execution.hiddenTestPassRate ?? null,
      hiddenTestTotal:      ctx.execution.hiddenTestTotal ?? null,
      hiddenTestPassed:     ctx.execution.hiddenTestPassed ?? null,
      coveragePercent:      ctx.staticAnalysis.coveragePercent ?? null,
      criticalVulns:        ctx.staticAnalysis.criticalVulns ?? null,
      highVulns:            ctx.staticAnalysis.highVulns ?? null,
      evidenceItems:        finalScores.detailsJson?.evidence || null,
      // Competency (Phase 4)
      competencyLevel:      competencyResult?.level ?? null,
      competencyDomain:     competencyResult?.domain ?? null,
      competencyBreakdown:  competencyResult?.breakdown ?? null,
    });

    await submissionRepo.updateStatus(submissionId, 'REVIEWED');
    reviewProgress.complete(submissionId);

    // Emit ScoreReady event
    try {
      const eventBus = require('../utils/eventBus');
      eventBus.emit('ScoreReady', { userId: submission.userId, submissionId: submission.id, scoreId: score.id });
    } catch (_) {}

    // Enqueue portfolio generation
    try {
      if (process.env.REDIS_DISABLED !== 'true') {
        const portfolioQueue = require('../queues/portfolio.queue');
        await portfolioQueue.add('generate', { userId: submission.userId, submissionId: submission.id, scoreId: score.id });
      }
    } catch (portfolioErr) {
      logger.warn({ submissionId, error: portfolioErr.message }, '[Review] Portfolio queue failed');
    }

    // Post PR comment
    try {
      const comment = generatePRComment(finalScores, ctx.llmNarrative.raw, ctx.staticAnalysis, ctx.ci, ctx.execution);
      await githubService.postPRComment(ctx.github.octokit, repoFullName, prNumber, comment);
    } catch (commentErr) {
      logger.warn({ submissionId, error: commentErr.message }, '[Review] PR comment failed');
    }

    // Generate reflection questions asynchronously (Phase 3)
    // Non-blocking: questions appear within seconds, student sees them on their dashboard
    setImmediate(async () => {
      try {
        const reflectionService = require('./review/reflection.service');
        const questions = await reflectionService.generateQuestions(ctx.pr.metadata, ctx.pr.diff);
        const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        await submissionRepo.update(submissionId, {
          reflectionQuestions: questions,
          reflectionDueAt: dueAt,
        });
        logger.info({ submissionId, questionCount: questions.length }, '[Review] Reflection questions generated and saved');
      } catch (reflErr) {
        logger.warn({ submissionId, error: reflErr.message }, '[Review] Reflection question generation failed');
      }
    });

    return {
      success: true,
      submissionId,
      prNumber,
      prReviewId: prReview.id,
      scoreId: score.id,
      totalScore: finalScores.totalScore,
      badge: finalScores.badge,
      verificationTier: finalScores.verificationTier,
      dockerBuildSuccess: ctx.execution.dockerBuildSuccess,
      hiddenTestPassRate: ctx.execution.hiddenTestPassRate,
      competencyLevel: competencyResult?.level ?? null,
      competencyDomain: competencyResult?.domain ?? null,
      llmFallback: ctx.llmNarrative.fallback,
    };
  } catch (error) {
    reviewProgress.fail(submissionId, error);
    logger.error({ submissionId, error: error.message, stack: error.stack }, '[Review] Pipeline error');

    // Save partial review if we have at least static analysis
    if (ctx.staticAnalysis.eslintErrors !== undefined && !ctx.llmNarrative.raw) {
      try {
        await prReviewRepo.create({
          submissionId,
          prNumber,
          reviewJson: { summary: 'AI review unavailable. Static analysis completed.', error: error.message },
          staticReport: ctx.staticAnalysis,
          suggestions: [],
        });
      } catch (_) {}
    }

    throw error;
  }
}

/**
 * Generate PR comment — now includes execution evidence section.
 */
function generatePRComment(finalScores, llmScores, staticReport, ciReport, executionResult) {
  const totalScore = finalScores.totalScore;
  const summary = llmScores?.summary || 'Review completed.';
  const suggestions = llmScores?.suggestions || [];
  const tier = finalScores.verificationTier || 'NOT_VERIFIED';

  const tierEmoji = { VERIFIED: '✅', PARTIAL: '⚠️', NOT_VERIFIED: '❌' };
  const tierLabel = { VERIFIED: 'Verified', PARTIAL: 'Partially Verified', NOT_VERIFIED: 'Not Verified' };

  let comment = `## 🔍 DevHubs Verification Review\n\n`;
  comment += `### ${tierEmoji[tier]} ${tierLabel[tier]} — Score: **${totalScore}/100** (${finalScores.badge})\n\n`;

  // Execution evidence section
  if (executionResult && executionResult.dispatched !== false) {
    comment += `### Execution Evidence\n`;
    if (executionResult.dockerBuildSuccess === true) {
      comment += `- ✅ Docker Build: SUCCESS (${executionResult.dockerBuildDurationMs}ms)\n`;
    } else if (executionResult.dockerBuildSuccess === false) {
      comment += `- ❌ Docker Build: ${executionResult.noDockerfile ? 'No Dockerfile found' : 'FAILED'}\n`;
    } else {
      comment += `- ⏳ Docker Build: Evidence pending or timed out\n`;
    }

    if (executionResult.hiddenTestPassRate !== null && executionResult.hiddenTestPassRate !== undefined) {
      const rate = Math.round(executionResult.hiddenTestPassRate * 100);
      comment += `- ${rate >= 60 ? '✅' : '❌'} Hidden Tests: ${executionResult.hiddenTestPassed}/${executionResult.hiddenTestTotal} passed (${rate}%)\n`;
    }
    comment += '\n';
  }

  comment += `### Score Breakdown\n`;
  comment += `| Category | Score |\n|---|---|\n`;
  const categories = [
    ['Code Quality', finalScores.codeQuality],
    ['Problem Solving', finalScores.problemSolving],
    ['Bug Risk', finalScores.bugRisk],
    ['DevOps Execution', finalScores.devopsExecution],
    ['Optimization', finalScores.optimization],
    ['Documentation', finalScores.documentation],
    ['Git Maturity', finalScores.gitMaturity],
    ['Collaboration', finalScores.collaboration],
    ['Delivery Speed', finalScores.deliverySpeed],
    ['Security', finalScores.security],
  ];
  categories.forEach(([name, score]) => {
    comment += `| ${name} | ${score}/10 |\n`;
  });

  comment += `\n### Summary\n${summary}\n\n`;

  if (suggestions.length > 0) {
    comment += `### Improvement Suggestions\n`;
    suggestions.forEach((s, i) => { comment += `${i + 1}. ${s}\n`; });
    comment += '\n';
  }

  comment += `### Static Analysis\n`;
  comment += `- ESLint: ${staticReport?.eslintErrors || 0} errors, ${staticReport?.eslintWarnings || 0} warnings\n`;
  comment += `- Secrets: ${(staticReport?.securityAlertCount || 0) > 0 ? `⚠️ ${staticReport.securityAlertCount} found` : '✅ None detected'}\n`;
  if ((staticReport?.criticalVulns || 0) > 0 || (staticReport?.highVulns || 0) > 0) {
    comment += `- Dependencies: ⚠️ ${staticReport.criticalVulns} critical, ${staticReport.highVulns} high vulnerabilities\n`;
  }
  comment += `- CI/CD: ${ciReport?.ciStatus || 'unknown'}\n`;

  if (finalScores.gateResults && finalScores.gateResults.length > 0) {
    const failed = finalScores.gateResults.filter((g) => !g.passed);
    if (failed.length > 0) {
      comment += `\n### Gates Not Passed\n`;
      failed.forEach((g) => { comment += `- ❌ ${g.label}\n`; });
    }
  }

  comment += `\n---\n*Generated by DevHubs Verification Engine*\n`;
  return comment;
}

module.exports = { processPRReview };
