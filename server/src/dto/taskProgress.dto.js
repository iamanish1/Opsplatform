const { param, body } = require('express-validator');

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

/**
 * Validation for task ID parameter
 */
const taskIdValidation = [
  param('taskId')
    .notEmpty()
    .withMessage('Task ID is required')
    .isString()
    .withMessage('Task ID must be a string'),
];

/**
 * Validation for updating task status
 */
const updateTaskStatusValidation = [
  body('completed')
    .notEmpty()
    .withMessage('Completed status is required')
    .isBoolean()
    .withMessage('Completed status must be a boolean'),
];

module.exports = {
  submissionIdValidation,
  taskIdValidation,
  updateTaskStatusValidation,
};

