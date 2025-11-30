const { body } = require('express-validator');

/**
 * Validation for updating company profile
 */
const updateCompanyProfileValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
];

module.exports = {
  updateCompanyProfileValidation,
};

