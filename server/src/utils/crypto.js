/**
 * AES-256-GCM encryption for sensitive values stored in the database.
 *
 * Requires: GITHUB_TOKEN_ENCRYPTION_KEY env var — 64 hex characters (32 bytes).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Format stored in DB:  <iv_hex>:<authTag_hex>:<ciphertext_hex>
 * This is self-contained — no external key metadata required.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getKey() {
  const hex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'GITHUB_TOKEN_ENCRYPTION_KEY must be set to a 64-char hex string in production'
      );
    }
    // Development fallback — deterministic but NOT secure
    return Buffer.alloc(32, 'devkey');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {string} Encrypted string in "<iv>:<tag>:<ciphertext>" hex format
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plaintext, or null if decryption fails.
 * @param {string} ciphertext
 * @returns {string|null}
 */
function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;

  // Handle legacy unencrypted values (no colon separators)
  // These were stored before encryption was added
  if (!ciphertext.includes(':')) return ciphertext;

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    // Decryption failure — return null so callers can handle gracefully
    return null;
  }
}

module.exports = { encrypt, decrypt };
