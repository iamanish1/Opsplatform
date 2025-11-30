/**
 * Company Routes
 * Company authentication and profile management
 */

const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate, requireCompany } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { companyLimiter } = require('../middlewares/rateLimit.middleware');
const { signupValidation } = require('../dto/company.signup.dto');
const { loginValidation } = require('../dto/company.login.dto');
const { updateCompanyProfileValidation } = require('../dto/company.update.dto');

/**
 * POST /api/company/signup
 * Company signup with email/password
 */
router.post('/signup', companyLimiter, signupValidation, validate, companyController.signup);

/**
 * POST /api/company/login
 * Company login with email/password
 */
router.post('/login', companyLimiter, loginValidation, validate, companyController.login);

/**
 * GET /api/company/profile
 * Get company profile
 * Auth: Required (company role)
 */
router.get('/profile', companyLimiter, authenticate, requireCompany, companyController.getProfile);

/**
 * PATCH /api/company/profile
 * Update company profile
 * Auth: Required (company role)
 */
router.patch(
  '/profile',
  companyLimiter,
  authenticate,
  requireCompany,
  updateCompanyProfileValidation,
  validate,
  companyController.updateProfile
);

/**
 * GET /api/company/portfolios/:slug
 * Get portfolio for company view (with interview request option)
 * Auth: Required (company role)
 */
const portfolioController = require('../controllers/portfolio.controller');
router.get('/portfolios/:slug', authenticate, requireCompany, portfolioController.getPortfolioForCompany);

module.exports = router;

