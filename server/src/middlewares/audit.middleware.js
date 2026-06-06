/**
 * Audit middleware factory.
 *
 * Usage in a route file:
 *   const { auditAction } = require('../middlewares/audit.middleware');
 *   router.post('/submit', authenticate, auditAction('submission.submit', 'Submission'), handler);
 *
 * It runs AFTER the handler completes (response finish event) so it captures
 * the outcome status code.  Non-blocking — errors are swallowed.
 */

const auditLog = require('../repositories/auditLog.repo');

/**
 * Create an audit middleware for a specific action.
 * @param {string} action  - Dot-notation action name, e.g. "submission.submit"
 * @param {string} resource - Resource type, e.g. "Submission"
 * @param {Function} [resourceIdFn] - Optional (req) => string to extract resource ID
 */
function auditAction(action, resource, resourceIdFn = null) {
  return (req, res, next) => {
    // Attach an on-finish listener so we capture the response status code
    res.on('finish', () => {
      const resourceId = resourceIdFn ? resourceIdFn(req) : (req.params?.id || req.params?.submissionId || null);
      const metadata = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
      };

      // Fire-and-forget
      auditLog.log({
        userId: req.user?.id || null,
        action,
        resource,
        resourceId,
        metadata,
      });
    });

    next();
  };
}

module.exports = { auditAction };
