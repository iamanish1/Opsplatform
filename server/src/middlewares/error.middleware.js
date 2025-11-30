const logger = require('../utils/logger');
const Sentry = require('../utils/sentry');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Log error for debugging
  logger.error({
    code: errorCode,
    message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  }, 'Request error');

  // Send to Sentry for server errors
  if (statusCode >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        errorCode,
        path: req.path,
        method: req.method,
      },
      extra: {
        userId: req.user?.id,
        body: req.body,
      },
    });
  }

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isServerError = statusCode >= 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: isServerError && !isDevelopment 
        ? 'Internal server error' 
        : message,
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;

