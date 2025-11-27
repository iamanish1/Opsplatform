/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 * Must be used after authenticate middleware
 */

/**
 * Require specific role(s)
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Ensure authenticate middleware was called first
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};

