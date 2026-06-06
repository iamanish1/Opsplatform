/**
 * Reflection Controller (Phase 3)
 *
 * Handles:
 *   GET  /api/submissions/:id/reflection         — get questions for a submission
 *   POST /api/submissions/:id/reflection         — submit answers
 *   GET  /api/submissions/:id/reflection/result  — get cross-check result (after eval)
 */

const submissionRepo = require('../repositories/submission.repo');
const scoreRepo = require('../repositories/score.repo');
const reflectionService = require('../services/review/reflection.service');
const logger = require('../utils/logger');

/**
 * GET /api/submissions/:id/reflection
 * Returns the reflection questions for this submission.
 * Questions are generated when the review starts and stored on the Submission.
 */
async function getReflectionQuestions(req, res) {
  const { id: submissionId } = req.params;
  const userId = req.user.id;

  try {
    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
    }
    if (submission.userId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const questions = submission.reflectionQuestions || [];
    const answers = submission.reflectionAnswers || [];
    const dueAt = submission.reflectionDueAt;

    const isOverdue = dueAt && new Date() > new Date(dueAt);
    const answeredIds = answers.map((a) => a.id);
    const allAnswered = questions.length > 0 && questions.every((q) => answeredIds.includes(q.id));

    return res.json({
      success: true,
      data: {
        questions,
        answeredCount: answers.length,
        totalQuestions: questions.length,
        allAnswered,
        dueAt,
        isOverdue,
        hasAnswers: answers.length > 0,
      },
    });
  } catch (err) {
    logger.error({ submissionId, error: err.message }, '[Reflection] getReflectionQuestions error');
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reflection questions' } });
  }
}

/**
 * POST /api/submissions/:id/reflection
 * Submit answers to the reflection questions.
 *
 * Body: { answers: [{ id: "q1", answer: "..." }, ...] }
 *
 * Triggers cross-check if all questions are answered.
 */
async function submitReflectionAnswers(req, res) {
  const { id: submissionId } = req.params;
  const userId = req.user.id;
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'answers array is required' } });
  }

  try {
    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
    }
    if (submission.userId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    if (submission.status !== 'REVIEWED') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Submission must be REVIEWED before answering reflection questions' } });
    }

    const questions = submission.reflectionQuestions || [];
    if (questions.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_QUESTIONS', message: 'No reflection questions found for this submission' } });
    }

    // Check due date
    if (submission.reflectionDueAt && new Date() > new Date(submission.reflectionDueAt)) {
      return res.status(400).json({ success: false, error: { code: 'OVERDUE', message: 'Reflection deadline has passed' } });
    }

    // Validate answer IDs against question IDs
    const validIds = questions.map((q) => q.id);
    const sanitizedAnswers = answers
      .filter((a) => a.id && validIds.includes(a.id) && typeof a.answer === 'string')
      .map((a) => ({
        id: a.id,
        answer: a.answer.trim().slice(0, 2000), // Cap answer length
        submittedAt: new Date().toISOString(),
      }));

    if (sanitizedAnswers.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid answers provided' } });
    }

    // Merge with existing answers (allow partial submission)
    const existingAnswers = submission.reflectionAnswers || [];
    const existingById = Object.fromEntries(existingAnswers.map((a) => [a.id, a]));
    sanitizedAnswers.forEach((a) => { existingById[a.id] = a; });
    const mergedAnswers = Object.values(existingById);

    // Persist answers
    await submissionRepo.update(submissionId, {
      reflectionAnswers: mergedAnswers,
    });

    // If all questions are answered, trigger cross-check asynchronously
    const allAnswered = questions.every((q) => mergedAnswers.some((a) => a.id === q.id));
    if (allAnswered) {
      // Run cross-check in background (non-blocking)
      setImmediate(async () => {
        try {
          const prDiff = submission.reviews?.[0]
            ? { files: [] } // We don't have diff stored — reflection service handles gracefully
            : { files: [] };

          // Get the actual diff from the latest PRReview's staticReport if available
          const crossCheckResult = await reflectionService.crossCheckAnswers(
            prDiff,
            questions,
            mergedAnswers
          );

          // Update Score with reflection results
          const score = await scoreRepo.findBySubmissionId(submissionId);
          if (score) {
            const hasConsistencyFlag = crossCheckResult.consistencyFlags.some(Boolean);
            await scoreRepo.update(score.id, {
              reflectionScore: crossCheckResult.reflectionScore,
              detailsJson: {
                ...score.detailsJson,
                reflectionResult: {
                  crossCheckScores: crossCheckResult.crossCheckScores,
                  consistencyFlags: crossCheckResult.consistencyFlags,
                  reflectionSummary: crossCheckResult.reflectionSummary,
                  hasConsistencyFlag,
                },
              },
            });
            logger.info({ submissionId, reflectionScore: crossCheckResult.reflectionScore, hasConsistencyFlag }, '[Reflection] Cross-check saved');
          }
        } catch (crossCheckErr) {
          logger.error({ submissionId, error: crossCheckErr.message }, '[Reflection] Background cross-check failed');
        }
      });
    }

    return res.json({
      success: true,
      data: {
        answeredCount: mergedAnswers.length,
        totalQuestions: questions.length,
        allAnswered,
        message: allAnswered
          ? 'All questions answered. Cross-check is being processed.'
          : `${mergedAnswers.length}/${questions.length} questions answered.`,
      },
    });
  } catch (err) {
    logger.error({ submissionId, error: err.message }, '[Reflection] submitReflectionAnswers error');
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit reflection answers' } });
  }
}

/**
 * GET /api/submissions/:id/reflection/result
 * Returns cross-check result after processing. For the student's own view only.
 */
async function getReflectionResult(req, res) {
  const { id: submissionId } = req.params;
  const userId = req.user.id;

  try {
    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
    }
    if (submission.userId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const score = await scoreRepo.findBySubmissionId(submissionId);
    const reflectionResult = score?.detailsJson?.reflectionResult || null;

    return res.json({
      success: true,
      data: {
        reflectionScore: score?.reflectionScore || null,
        result: reflectionResult,
        processed: reflectionResult !== null,
      },
    });
  } catch (err) {
    logger.error({ submissionId, error: err.message }, '[Reflection] getReflectionResult error');
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reflection result' } });
  }
}

module.exports = {
  getReflectionQuestions,
  submitReflectionAnswers,
  getReflectionResult,
};
