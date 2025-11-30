const { param } = require('express-validator');

/**
 * Validation for project ID parameter
 */
const projectIdValidation = [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isString()
    .withMessage('Project ID must be a string'),
];

module.exports = {
  projectIdValidation,
};

