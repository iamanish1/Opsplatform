const { validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Checks validation results from express-validator
 * Returns 400 Bad Request if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Validation failed',
        details: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
        })),
      },
    });
  }

  next();
};

module.exports = {
  validate,
};

