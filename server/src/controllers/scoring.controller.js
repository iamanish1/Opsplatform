/**
 * Scoring Controller
 * Internal API endpoint for score computation
 */

const scoringService = require('../services/review/scoring.service');
const scoreRepo = require('../repositories/score.repo');

/**
 * Compute score from LLM output and static analysis
 * POST /internal/score/compute
 */
async function computeScore(req, res, next) {
  try {
    const { llmOutput, staticReport, ciReport, prMetadata, submissionId } = req.body;

    // Validate required inputs
    if (!llmOutput) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required field: llmOutput' },
      });
    }

    if (!staticReport) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required field: staticReport' },
      });
    }

    // Generate score using scoring engine
    const scoreResult = scoringService.generateScore(llmOutput, staticReport, ciReport || {}, prMetadata || {});

    // If submissionId provided, save to database
    let scoreId = null;
    if (submissionId) {
      const score = await scoreRepo.createOrUpdate({
        submissionId,
        codeQuality: scoreResult.codeQuality,
        problemSolving: scoreResult.problemSolving,
        bugRisk: scoreResult.bugRisk,
        devopsExecution: scoreResult.devopsExecution,
        optimization: scoreResult.optimization,
        documentation: scoreResult.documentation,
        gitMaturity: scoreResult.gitMaturity,
        collaboration: scoreResult.collaboration,
        deliverySpeed: scoreResult.deliverySpeed,
        security: scoreResult.security,
        reliability: scoreResult.reliability,
        totalScore: scoreResult.totalScore,
        badge: scoreResult.badge,
        detailsJson: scoreResult.detailsJson,
      });
      scoreId = score.id;
    }

    // Return score result
    res.status(200).json({
      success: true,
      data: {
        scoreId,
        totalScore: scoreResult.totalScore,
        badge: scoreResult.badge,
        breakdown: scoreResult.detailsJson.breakdown,
        evidence: scoreResult.detailsJson.evidence,
        summary: scoreResult.detailsJson.summary,
        suggestions: scoreResult.detailsJson.suggestions,
      },
    });
  } catch (error) {
    console.error('[Scoring Controller] Error computing score:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to compute score', details: error.message },
    });
  }
}

module.exports = {
  computeScore,
};

