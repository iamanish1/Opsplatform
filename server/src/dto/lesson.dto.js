const { param } = require('express-validator');

/**
 * Validation for lesson ID parameter
 */
const lessonIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .isString()
    .withMessage('Lesson ID must be a string'),
];

module.exports = {
  lessonIdValidation,
};

