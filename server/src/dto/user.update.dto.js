const { body, validationResult } = require('express-validator');

/**
 * Validation rules for PATCH /api/user
 */
const updateUserValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters')
    .trim(),

  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
    .trim(),
];

/**
 * Validation rules for PATCH /api/user/onboarding
 */
const updateOnboardingValidation = [
  body('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),

  body('onboardingStep')
    .isInt({ min: 0, max: 4 })
    .withMessage('Onboarding step must be an integer between 0 and 4'),
];

/**
 * Validation rules for POST /api/user/link-github
 */
const linkGitHubValidation = [
  body('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),

  body('githubId')
    .notEmpty()
    .withMessage('GitHub ID is required')
    .isString()
    .withMessage('GitHub ID must be a string'),

  body('githubUsername')
    .optional()
    .isString()
    .withMessage('GitHub username must be a string')
    .trim(),

  body('githubProfile')
    .optional()
    .isURL()
    .withMessage('GitHub profile must be a valid URL')
    .trim(),

  body('githubInstallId')
    .optional()
    .isString()
    .withMessage('GitHub installation ID must be a string')
    .trim(),
];

module.exports = {
  updateUserValidation,
  updateOnboardingValidation,
  linkGitHubValidation,
};

