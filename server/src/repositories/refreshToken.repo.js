const prisma = require('../prisma/client');
const crypto = require('crypto');

/**
 * Generate a cryptographically secure refresh token string
 * @returns {string} 64-byte hex token
 */
function generateTokenValue() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Create a new refresh token for a user
 * @param {string} userId
 * @param {number} ttlDays - Token lifetime in days (default 30)
 * @returns {Promise<{token: string, record: Object}>}
 */
async function create(userId, ttlDays = 30) {
  const token = generateTokenValue();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const record = await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return { token, record };
}

/**
 * Find a valid (non-revoked, non-expired) refresh token
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
async function findValid(token) {
  return prisma.refreshToken.findFirst({
    where: {
      token,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}

/**
 * Revoke a single refresh token (logout)
 * @param {string} token
 */
async function revoke(token) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all refresh tokens for a user (force logout everywhere)
 * @param {string} userId
 */
async function revokeAll(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Delete expired tokens older than retentionDays (cleanup job)
 * @param {number} retentionDays
 */
async function deleteExpired(retentionDays = 7) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });
}

module.exports = { create, findValid, revoke, revokeAll, deleteExpired };
