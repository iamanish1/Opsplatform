const { body } = require('express-validator');

/**
 * Validation rules for POST /api/projects/:projectId/start
 */
const startSubmissionValidation = [
  body('repoUrl')
    .notEmpty()
    .withMessage('Repository URL is required')
    .isString()
    .withMessage('Repository URL must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Repository URL must be between 1 and 255 characters')
    .custom((value) => {
      if (!value.startsWith('https://github.com/')) {
        throw new Error('Repository URL must start with https://github.com/');
      }
      return true;
    })
    .isURL()
    .withMessage('Repository URL must be a valid URL')
    .custom((value) => {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
          throw new Error('Repository URL must be a GitHub URL');
        }
      } catch (e) {
        throw new Error('Repository URL must be a valid GitHub URL');
      }
      return true;
    })
    .trim(),
];

module.exports = {
  startSubmissionValidation,
};

