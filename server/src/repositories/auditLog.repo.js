const prisma = require('../prisma/client');

/**
 * Write an audit log entry.
 * Fire-and-forget safe — errors are logged but never thrown to callers.
 *
 * @param {Object} params
 * @param {string|null} params.userId
 * @param {string} params.action   - e.g. "submission.submit", "admin.delete_user"
 * @param {string} params.resource - e.g. "Submission", "User"
 * @param {string|null} params.resourceId
 * @param {Object|null} params.metadata - additional context (IP, payload, etc.)
 */
async function log({ userId = null, action, resource, resourceId = null, metadata = null }) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, metadata },
    });
  } catch (err) {
    // Never block the request — audit failures are non-fatal
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
}

/**
 * Query audit logs (admin use).
 * @param {Object} filters
 * @param {string} [filters.userId]
 * @param {string} [filters.resource]
 * @param {string} [filters.action]
 * @param {Date} [filters.from]
 * @param {Date} [filters.to]
 * @param {number} [filters.limit=50]
 * @param {number} [filters.offset=0]
 */
async function query({ userId, resource, action, from, to, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = { contains: action };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total };
}

module.exports = { log, query };
