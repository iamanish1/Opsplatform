/**
 * Company Controller
 * Handles company authentication and profile management
 */

const companyService = require('../services/company.service');
const { signupValidation, handleValidationErrors } = require('../dto/company.signup.dto');
const { loginValidation } = require('../dto/company.login.dto');
const { validationResult } = require('express-validator');

/**
 * Company signup
 * POST /api/company/signup
 */
async function signup(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { email, password, companyName } = req.body;

    const result = await companyService.signup(email, password, companyName);

    res.status(201).json({
      success: true,
      message: 'Company account created successfully',
      ...result,
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Company login
 * POST /api/company/login
 */
async function login(req, res, next) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { email, password } = req.body;

    const result = await companyService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    if (
      error.message === 'Invalid email or password' ||
      error.message === 'This account is not a company account' ||
      error.message === 'This account does not have a password. Please use GitHub OAuth or reset password.'
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Get company profile
 * GET /api/company/profile
 * Auth: Required (company role)
 */
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const company = await companyService.getProfile(userId);

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    if (error.message === 'Company profile not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Update company profile
 * PATCH /api/company/profile
 * Auth: Required (company role)
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Allowed fields for update
    const allowedFields = [
      'companyName',
      'website',
      'logo',
      'about',
      'industry',
      'location',
      'teamSize',
      'hiringNeeds',
    ];

    // Filter to only allowed fields
    const filteredData = {};
    Object.keys(profileData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = profileData[key];
      }
    });

    const updated = await companyService.updateProfile(userId, filteredData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      company: updated,
    });
  } catch (error) {
    if (error.message === 'Company profile not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
};

