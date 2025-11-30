/**
 * Portfolio Generation Service
 * Generates complete portfolio JSON from reviewed submissions
 */

const userRepo = require('../repositories/user.repo');
const submissionRepo = require('../repositories/submission.repo');
const portfolioRepo = require('../repositories/portfolio.repo');
const prReviewRepo = require('../repositories/prReview.repo');
const logger = require('../utils/logger');

/**
 * Generate portfolio for a submission
 * @param {Object} jobData - Job data from queue
 * @param {string} jobData.userId - User ID
 * @param {string} jobData.submissionId - Submission ID
 * @param {string} jobData.scoreId - Score ID (optional)
 * @returns {Promise<Object>} Portfolio result
 */
async function generate(jobData) {
  const { userId, submissionId, scoreId } = jobData;

  logger.info({ submissionId }, 'Portfolio service generating portfolio');

  try {
    // 1. Fetch all required data
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    if (submission.status !== 'REVIEWED') {
      throw new Error(`Submission ${submissionId} is not reviewed yet`);
    }

    const score = submission.score;
    if (!score) {
      throw new Error(`Score not found for submission ${submissionId}`);
    }

    const prReview = await prReviewRepo.findBySubmissionId(submissionId);
    if (!prReview) {
      throw new Error(`PR review not found for submission ${submissionId}`);
    }

    // 2. Build portfolio JSON structure
    const portfolioJson = {
      header: buildHeaderSection(user),
      score: buildScoreSection(score),
      project: buildProjectSection(submission, submission.project),
      review: buildReviewSection(prReview, score),
      evidence: buildEvidenceSection(score.detailsJson),
      timeline: buildTimelineSection(submission, score, prReview),
    };

    // 3. Generate slug
    const slug = generateSlug(user.githubUsername, submissionId);

    // 4. Save/update portfolio in database
    const portfolio = await portfolioRepo.upsertBySubmission(submissionId, {
      userId,
      slug,
      scoreId: score.id,
      summary: null, // User can customize later
      portfolioJson,
    });

    logger.info({ portfolioId: portfolio.id, slug, submissionId }, 'Portfolio service portfolio generated');

    return {
      success: true,
      portfolioId: portfolio.id,
      slug,
      portfolioJson,
    };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, submissionId }, 'Portfolio service error generating portfolio');
    throw error;
  }
}

/**
 * Build developer header section
 * @param {Object} user - User object
 * @returns {Object} Header section
 */
function buildHeaderSection(user) {
  return {
    name: user.name || user.githubUsername || 'Developer',
    githubUsername: user.githubUsername || null,
    avatar: user.avatar || null,
    bio: null, // Can be added later if user profile has bio
    developerType: getDeveloperType(user.onboardingStep),
  };
}

/**
 * Get developer type based on onboarding step
 * @param {number} onboardingStep - Onboarding step
 * @returns {string} Developer type
 */
function getDeveloperType(onboardingStep) {
  if (onboardingStep === 0) return 'Student';
  if (onboardingStep === 1) return 'Fresher';
  if (onboardingStep === 2) return 'DevOps Beginner';
  if (onboardingStep >= 3) return 'DevOps Practitioner';
  return 'Student';
}

/**
 * Build Talent Assurance Score section
 * @param {Object} score - Score object
 * @returns {Object} Score section
 */
function buildScoreSection(score) {
  const detailsJson = score.detailsJson || {};
  const breakdown = detailsJson.breakdown || {
    codeQuality: score.codeQuality,
    problemSolving: score.problemSolving,
    bugRisk: score.bugRisk,
    devopsExecution: score.devopsExecution,
    optimization: score.optimization,
    documentation: score.documentation,
    gitMaturity: score.gitMaturity,
    collaboration: score.collaboration,
    deliverySpeed: score.deliverySpeed,
    security: score.security,
  };

  // Build category details with explanations
  const categoryDetails = [
    {
      name: 'Code Quality',
      score: breakdown.codeQuality,
      maxScore: 10,
      explanation: getCategoryExplanation('codeQuality', breakdown.codeQuality, detailsJson),
    },
    {
      name: 'Problem Solving',
      score: breakdown.problemSolving,
      maxScore: 10,
      explanation: getCategoryExplanation('problemSolving', breakdown.problemSolving, detailsJson),
    },
    {
      name: 'Bug Risk',
      score: breakdown.bugRisk,
      maxScore: 10,
      explanation: getCategoryExplanation('bugRisk', breakdown.bugRisk, detailsJson),
    },
    {
      name: 'DevOps Execution',
      score: breakdown.devopsExecution,
      maxScore: 10,
      explanation: getCategoryExplanation('devopsExecution', breakdown.devopsExecution, detailsJson),
    },
    {
      name: 'Optimization',
      score: breakdown.optimization,
      maxScore: 10,
      explanation: getCategoryExplanation('optimization', breakdown.optimization, detailsJson),
    },
    {
      name: 'Documentation',
      score: breakdown.documentation,
      maxScore: 10,
      explanation: getCategoryExplanation('documentation', breakdown.documentation, detailsJson),
    },
    {
      name: 'Git Maturity',
      score: breakdown.gitMaturity,
      maxScore: 10,
      explanation: getCategoryExplanation('gitMaturity', breakdown.gitMaturity, detailsJson),
    },
    {
      name: 'Collaboration',
      score: breakdown.collaboration,
      maxScore: 10,
      explanation: getCategoryExplanation('collaboration', breakdown.collaboration, detailsJson),
    },
    {
      name: 'Delivery Speed',
      score: breakdown.deliverySpeed,
      maxScore: 10,
      explanation: getCategoryExplanation('deliverySpeed', breakdown.deliverySpeed, detailsJson),
    },
    {
      name: 'Security',
      score: breakdown.security,
      maxScore: 10,
      explanation: getCategoryExplanation('security', breakdown.security, detailsJson),
    },
  ];

  return {
    totalScore: score.totalScore,
    badge: score.badge,
    summary: getScoreSummary(score.totalScore, score.badge),
    breakdown,
    categoryDetails,
  };
}

/**
 * Get category explanation from evidence
 * @param {string} category - Category name
 * @param {number} score - Category score
 * @param {Object} detailsJson - Details JSON
 * @returns {string} Explanation
 */
function getCategoryExplanation(category, score, detailsJson) {
  const evidence = detailsJson.evidence || [];
  const categoryEvidence = evidence.filter((e) =>
    e.toLowerCase().includes(category.toLowerCase())
  );

  if (categoryEvidence.length > 0) {
    return categoryEvidence[0];
  }

  // Fallback explanation
  if (score >= 8) return `Excellent ${category} practices`;
  if (score >= 6) return `Good ${category} with room for improvement`;
  if (score >= 4) return `Basic ${category} needs attention`;
  return `Poor ${category} requires significant improvement`;
}

/**
 * Get score summary text
 * @param {number} totalScore - Total score
 * @param {string} badge - Badge (GREEN, YELLOW, RED)
 * @returns {string} Summary text
 */
function getScoreSummary(totalScore, badge) {
  if (badge === 'GREEN') {
    return 'Production-ready';
  }
  if (badge === 'YELLOW') {
    return 'Needs mentorship';
  }
  return 'Requires significant improvement';
}

/**
 * Build verified DevOps project section
 * @param {Object} submission - Submission object
 * @param {Object} project - Project object
 * @returns {Object} Project section
 */
function buildProjectSection(submission, project) {
  return {
    title: project.title,
    description: project.description,
    repoUrl: submission.repoUrl,
    prNumber: submission.prNumber,
    prUrl: generatePRUrl(submission.repoUrl, submission.prNumber),
    ciStatus: getCIStatus(submission), // Will be determined from static report if available
    deploymentLink: null, // Can be added later if available
  };
}

/**
 * Get CI status from submission/review data
 * @param {Object} submission - Submission object
 * @returns {string} CI status
 */
function getCIStatus(submission) {
  // This would ideally come from the PR review static report
  // For now, return unknown
  return 'unknown';
}

/**
 * Build PR review section (AI report)
 * @param {Object} prReview - PR review object
 * @param {Object} score - Score object
 * @returns {Object} Review section
 */
function buildReviewSection(prReview, score) {
  const reviewJson = prReview.reviewJson || {};
  const staticReport = prReview.staticReport || {};
  const detailsJson = score.detailsJson || {};

  // Extract strengths and weaknesses
  const { strengths, weaknesses } = extractStrengthsAndWeaknesses(score, prReview);

  // Build static analysis summary
  const staticAnalysis = {
    eslint: {
      errors: staticReport.eslintErrors || 0,
      warnings: staticReport.eslintWarnings || 0,
    },
    docker: {
      issues: staticReport.dockerIssues || 0,
    },
    security: {
      alerts: staticReport.securityAlertCount || 0,
    },
  };

  return {
    summary: reviewJson.summary || detailsJson.summary || 'No summary available',
    strengths: strengths,
    weaknesses: weaknesses,
    suggestions: reviewJson.suggestions || detailsJson.suggestions || [],
    staticAnalysis,
  };
}

/**
 * Extract strengths and weaknesses from score and review
 * @param {Object} score - Score object
 * @param {Object} prReview - PR review object
 * @returns {Object} { strengths, weaknesses }
 */
function extractStrengthsAndWeaknesses(score, prReview) {
  const detailsJson = score.detailsJson || {};
  const breakdown = detailsJson.breakdown || {
    codeQuality: score.codeQuality,
    problemSolving: score.problemSolving,
    bugRisk: score.bugRisk,
    devopsExecution: score.devopsExecution,
    optimization: score.optimization,
    documentation: score.documentation,
    gitMaturity: score.gitMaturity,
    collaboration: score.collaboration,
    deliverySpeed: score.deliverySpeed,
    security: score.security,
  };

  const strengths = [];
  const weaknesses = [];

  // Category names mapping
  const categoryNames = {
    codeQuality: 'Code Quality',
    problemSolving: 'Problem Solving',
    bugRisk: 'Bug Risk',
    devopsExecution: 'DevOps Execution',
    optimization: 'Optimization',
    documentation: 'Documentation',
    gitMaturity: 'Git Maturity',
    collaboration: 'Collaboration',
    deliverySpeed: 'Delivery Speed',
    security: 'Security',
  };

  // Identify strengths (scores >= 8)
  Object.entries(breakdown).forEach(([key, value]) => {
    if (value >= 8) {
      strengths.push(`${categoryNames[key]}: Strong performance (${value}/10)`);
    }
  });

  // Identify weaknesses (scores <= 5)
  Object.entries(breakdown).forEach(([key, value]) => {
    if (value <= 5) {
      weaknesses.push(`${categoryNames[key]}: Needs improvement (${value}/10)`);
    }
  });

  // If no strengths/weaknesses found, add generic ones
  if (strengths.length === 0) {
    strengths.push('Consistent performance across categories');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('No major weaknesses identified');
  }

  return { strengths, weaknesses };
}

/**
 * Build evidence section
 * @param {Object} detailsJson - Score details JSON
 * @returns {Array} Evidence array
 */
function buildEvidenceSection(detailsJson) {
  if (!detailsJson || !detailsJson.evidence) {
    return [];
  }
  return detailsJson.evidence;
}

/**
 * Build activity timeline section
 * @param {Object} submission - Submission object
 * @param {Object} score - Score object
 * @param {Object} prReview - PR review object
 * @returns {Array} Timeline events
 */
function buildTimelineSection(submission, score, prReview) {
  const timeline = [];

  if (submission.createdAt) {
    timeline.push({
      event: 'PR Opened',
      timestamp: submission.createdAt,
      description: 'Pull request created',
    });
  }

  if (prReview.createdAt) {
    timeline.push({
      event: 'CI Ran',
      timestamp: prReview.createdAt,
      description: 'CI/CD pipeline executed',
    });

    timeline.push({
      event: 'Review Generated',
      timestamp: prReview.createdAt,
      description: 'AI review completed',
    });
  }

  if (score.createdAt) {
    timeline.push({
      event: 'Score Computed',
      timestamp: score.createdAt,
      description: `Talent Assurance Score: ${score.totalScore}/100 (${score.badge})`,
    });
  }

  // Portfolio generation timestamp (current time)
  timeline.push({
    event: 'Portfolio Generated',
    timestamp: new Date(),
    description: 'Portfolio page created',
  });

  return timeline;
}

/**
 * Generate unique slug from GitHub username and submission ID
 * @param {string} githubUsername - GitHub username
 * @param {string} submissionId - Submission ID
 * @returns {string} Slug
 */
function generateSlug(githubUsername, submissionId) {
  if (!githubUsername) {
    throw new Error('GitHub username is required for slug generation');
  }

  // Use first 8 characters of submissionId for uniqueness
  const shortId = submissionId.substring(0, 8);
  return `${githubUsername}-${shortId}`;
}

/**
 * Generate GitHub PR URL from repo URL and PR number
 * @param {string} repoUrl - Repository URL
 * @param {number} prNumber - PR number
 * @returns {string|null} PR URL or null
 */
function generatePRUrl(repoUrl, prNumber) {
  if (!repoUrl || !prNumber) {
    return null;
  }

  // Extract owner/repo from repoUrl
  // Format: https://github.com/owner/repo or git@github.com:owner/repo.git
  let match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    return null;
  }

  const owner = match[1];
  const repo = match[2].replace('.git', '');
  return `https://github.com/${owner}/${repo}/pull/${prNumber}`;
}

module.exports = {
  generate,
  buildHeaderSection,
  buildScoreSection,
  buildProjectSection,
  buildReviewSection,
  buildEvidenceSection,
  buildTimelineSection,
  extractStrengthsAndWeaknesses,
  generateSlug,
  generatePRUrl,
};
