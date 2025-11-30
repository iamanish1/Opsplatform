const { body, validationResult } = require('express-validator');
const userRepo = require('../repositories/user.repo');

/**
 * Validation rules for company signup
 */
const signupValidation = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        throw new Error('Email already registered');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('companyName')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Company name must be at least 3 characters long')
    .notEmpty()
    .withMessage('Company name is required'),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
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
  next();
};

module.exports = {
  signupValidation,
  handleValidationErrors,
};

