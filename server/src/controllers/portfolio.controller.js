/**
 * Portfolio Controller
 * Handles portfolio API endpoints
 */

const portfolioRepo = require('../repositories/portfolio.repo');

/**
 * Get portfolio by slug (public endpoint)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getPortfolioBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: 'Slug is required' });
    }

    const portfolio = await portfolioRepo.findBySlug(slug);

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    res.status(200).json({
      id: portfolio.id,
      slug: portfolio.slug,
      summary: portfolio.summary,
      portfolioJson: portfolio.portfolioJson,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      user: portfolio.user,
      submission: portfolio.submission,
      score: portfolio.score,
    });
  } catch (error) {
    console.error('Error fetching portfolio by slug:', error);
    next(error);
  }
}

/**
 * Get all portfolios for authenticated user
 * @param {Object} req - Express request (with req.user from auth middleware)
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getUserPortfolios(req, res, next) {
  try {
    const userId = req.user.id;

    const portfolios = await portfolioRepo.findByUserId(userId);

    res.status(200).json({
      portfolios: portfolios.map((p) => ({
        id: p.id,
        slug: p.slug,
        summary: p.summary,
        portfolioJson: p.portfolioJson,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        submission: p.submission,
        score: p.score,
      })),
    });
  } catch (error) {
    console.error('Error fetching user portfolios:', error);
    next(error);
  }
}

/**
 * Get portfolio by submission ID (authenticated)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getPortfolioBySubmission(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    if (!submissionId) {
      return res.status(400).json({ message: 'Submission ID is required' });
    }

    const portfolio = await portfolioRepo.findBySubmissionId(submissionId);

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found for this submission' });
    }

    // Verify user owns this portfolio
    if (portfolio.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      id: portfolio.id,
      slug: portfolio.slug,
      summary: portfolio.summary,
      portfolioJson: portfolio.portfolioJson,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      user: portfolio.user,
      submission: portfolio.submission,
      score: portfolio.score,
    });
  } catch (error) {
    console.error('Error fetching portfolio by submission:', error);
    next(error);
  }
}

/**
 * Get portfolio for company view (with interview request option)
 * GET /api/company/portfolios/:slug
 * Auth: Required (company role)
 */
async function getPortfolioForCompany(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Slug is required',
        },
      });
    }

    const portfolio = await portfolioRepo.findBySlug(slug);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Portfolio not found',
        },
      });
    }

    // Return portfolio with additional company-specific data
    res.status(200).json({
      success: true,
      portfolio: {
        id: portfolio.id,
        slug: portfolio.slug,
        summary: portfolio.summary,
        portfolioJson: portfolio.portfolioJson,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
        user: portfolio.user,
        submission: portfolio.submission
          ? {
              id: portfolio.submission.id,
              repoUrl: portfolio.submission.repoUrl,
              prNumber: portfolio.submission.prNumber,
              status: portfolio.submission.status,
              project: portfolio.submission.project,
            }
          : null,
        score: portfolio.score,
        // Additional fields for company view
        canRequestInterview: true, // Company can always request interview
        submissionId: portfolio.submission?.id || null, // For interview request
        developerId: portfolio.user?.id || null, // For interview request
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio for company:', error);
    next(error);
  }
}

module.exports = {
  getPortfolioBySlug,
  getUserPortfolios,
  getPortfolioBySubmission,
  getPortfolioForCompany,
};

