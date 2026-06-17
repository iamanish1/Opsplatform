const logger = require('../utils/logger');
const Sentry = require('../utils/sentry');

/** Map Prisma error codes to safe public messages */
function sanitizePrismaError(err) {
  const code = err.code || '';
  // P1xxx = connection/auth errors, P2xxx = request errors
  if (code.startsWith('P1') || err.name === 'PrismaClientInitializationError') {
    return { statusCode: 503, message: 'Database is temporarily unavailable. Please try again shortly.', errorCode: 'DB_UNAVAILABLE' };
  }
  if (code === 'P2025') {
    return { statusCode: 404, message: 'Record not found.', errorCode: 'NOT_FOUND' };
  }
  if (code.startsWith('P2')) {
    return { statusCode: 400, message: 'Invalid request data.', errorCode: 'DB_REQUEST_ERROR' };
  }
  return null;
}

const errorHandler = (err, req, res, next) => {
  // Sanitize Prisma errors before anything else — never expose file paths or raw queries
  const prismaResult = sanitizePrismaError(err);
  if (prismaResult) {
    logger.error({ code: prismaResult.errorCode, path: req.path, method: req.method }, 'Prisma error');
    return res.status(prismaResult.statusCode).json({
      success: false,
      error: { code: prismaResult.errorCode, message: prismaResult.message },
    });
  }

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

