const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT Authentication Middleware
 * Extracts and verifies JWT token from Authorization header
 * Sets req.user with { id, role } on success
 */
const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token is required',
        },
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwtSecret);

      // Extract user info from token payload
      // Expected format: { sub: userId, role: 'STUDENT', iat, exp }
      const userId = decoded.sub || decoded.userId || decoded.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token payload',
          },
        });
      }

      // Set user info on request object
      req.user = {
        id: userId,
        role: decoded.role || 'STUDENT',
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token has expired',
          },
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        });
      }

      throw err;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if token is present, but doesn't fail if missing
 */
const authenticateOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const userId = decoded.sub || decoded.userId || decoded.id;

      if (userId) {
        req.user = {
          id: userId,
          role: decoded.role || 'STUDENT',
        };
      }
    } catch (err) {
      // Invalid token, continue without user
      // Don't fail the request
    }

    next();
  } catch (error) {
    // On error, continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
};
