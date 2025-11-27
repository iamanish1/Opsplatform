require('dotenv').config();
const jwt = require('jsonwebtoken');
const config = require('../src/config');

/**
 * Generate JWT token for testing
 * Usage: node scripts/generate-token.js <userId> <role>
 */

const userId = process.argv[2] || 'test-user-id';
const role = process.argv[3] || 'STUDENT';

const payload = {
  sub: userId,
  role: role,
  iat: Math.floor(Date.now() / 1000),
};

const token = jwt.sign(payload, config.jwtSecret, {
  expiresIn: config.jwtExpiresIn,
});

console.log('\n=== JWT Token Generated ===\n');
console.log('User ID:', userId);
console.log('Role:', role);
console.log('\nToken:');
console.log(token);
console.log('\nUse this header in your requests:');
console.log(`Authorization: Bearer ${token}\n`);

