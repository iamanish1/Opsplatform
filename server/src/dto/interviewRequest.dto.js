const { body, param } = require('express-validator');

/**
 * Validation for creating interview request
 */
const createInterviewRequestValidation = [
  body('portfolioSlug')
    .notEmpty()
    .withMessage('Portfolio slug is required')
    .isString()
    .withMessage('Portfolio slug must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Portfolio slug must be between 1 and 255 characters'),
  
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters'),
];

/**
 * Validation for interview request ID parameter
 */
const interviewRequestIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Interview request ID is required')
    .isString()
    .withMessage('Interview request ID must be a string'),
];

module.exports = {
  createInterviewRequestValidation,
  interviewRequestIdValidation,
};

