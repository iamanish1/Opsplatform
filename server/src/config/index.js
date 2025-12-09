require('dotenv').config();

// Import logger after dotenv is loaded
let logger;
try {
  logger = require('./utils/logger');
} catch (e) {
  // Fallback if logger not available yet
  logger = {
    warn: console.warn,
    error: console.error,
  };
}

/**
 * Validate required environment variables
 * Fails fast if critical variables are missing in production
 */
function validateEnvVars() {
  const requiredVars = [];
  const warnings = [];

  // Production required variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) requiredVars.push('DATABASE_URL');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      requiredVars.push('JWT_SECRET');
    }
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      warnings.push('GITHUB_WEBHOOK_SECRET (webhook security disabled)');
    }
  }

  // Always required
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
    warnings.push('DATABASE_URL (database connection will fail)');
  }

  if (requiredVars.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${requiredVars.join(', ')}`
    );
    error.code = 'MISSING_ENV_VARS';
    throw error;
  }

  if (warnings.length > 0) {
    logger.warn({ warnings }, 'Environment variable warnings');
  }
}

// Validate on module load (except in tests)
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnvVars();
  } catch (error) {
    logger.error({ error: error.message }, 'Environment validation failed');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // GitHub OAuth Configuration
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:4000/api/auth/github/callback',
  },
  
  // GitHub App Configuration
  githubApp: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  
  // Email Configuration
  email: {
    provider: 'resend',
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'notifications@devhubs.com',
    fromName: process.env.EMAIL_FROM_NAME || 'DevHubs',
  },
  
  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

