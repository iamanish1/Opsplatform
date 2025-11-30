const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Must be used after express-validator validation chains
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
  handleValidationErrors,
};

