const { body } = require('express-validator');

/**
 * Validation rules for company login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

module.exports = {
  loginValidation,
};

