const { param } = require('express-validator');

/**
 * Validation for submission ID parameter
 */
const submissionIdValidation = [
  param('submissionId')
    .notEmpty()
    .withMessage('Submission ID is required')
    .isString()
    .withMessage('Submission ID must be a string'),
];

module.exports = {
  submissionIdValidation,
};

