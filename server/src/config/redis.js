const Redis = require('ioredis');
const config = require('./index');

// Check if Redis is disabled
const REDIS_DISABLED = process.env.REDIS_DISABLED === 'true';

// Create Redis connection
// Supports REDIS_URL (for Upstash) or host/port fallback
let redis;

if (REDIS_DISABLED) {
  // Create a mock Redis instance that does nothing
  redis = {
    ping: async () => Promise.reject(new Error('Redis is disabled')),
    on: () => {},
    off: () => {},
    quit: async () => {},
    disconnect: () => {},
  };
  console.log('⚠️  Redis is disabled (REDIS_DISABLED=true)');
} else {
  const redisOptions = {
    lazyConnect: true, // Don't connect immediately
    enableOfflineQueue: false, // Don't queue commands when offline
    maxRetriesPerRequest: null, // Don't retry failed commands
    retryStrategy: (times) => {
      // Stop retrying immediately on connection refused (Redis not running)
      // Only retry for other types of errors
      return null; // Stop all retries - connection refused means Redis isn't running
    },
    reconnectOnError: (err) => {
      // Don't reconnect on connection refused - Redis isn't running
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        return false;
      }
      // Only reconnect on specific errors like READONLY
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  };

  if (config.redis.url) {
    // Use REDIS_URL (for Upstash: redis://default:password@host:port)
    redis = new Redis(config.redis.url, redisOptions);
  } else {
    // Fallback to host/port
    redis = new Redis({
      host: config.redis.host,
      port: parseInt(config.redis.port, 10),
      ...redisOptions,
    });
  }

  // Track connection state to reduce error spam
  let connectionAttempts = 0;
  let lastErrorTime = 0;
  const ERROR_THROTTLE_MS = 10000; // Only log errors every 10 seconds

  // Handle connection events
  redis.on('connect', () => {
    console.log('✓ Redis connected');
    connectionAttempts = 0;
  });

  redis.on('ready', () => {
    console.log('✓ Redis ready');
  });

  redis.on('error', (err) => {
    const now = Date.now();
    connectionAttempts++;
    
    // Only log errors if:
    // 1. It's the first few attempts, OR
    // 2. It's been more than ERROR_THROTTLE_MS since last error
    if (connectionAttempts <= 3 || (now - lastErrorTime) > ERROR_THROTTLE_MS) {
      if (err.code === 'ECONNREFUSED') {
        if (connectionAttempts === 1) {
          console.warn('⚠️  Redis not available. Queue features will be unavailable.');
          console.warn('   To disable Redis warnings, set REDIS_DISABLED=true in your .env file');
        }
      } else {
        console.error('Redis connection error:', err.message);
      }
      lastErrorTime = now;
    }
  });

  redis.on('close', () => {
    // Only log if we were previously connected
    if (connectionAttempts === 0) {
      console.log('Redis connection closed');
    }
  });

  redis.on('reconnecting', () => {
    // Suppress all reconnecting messages - we stop retrying on connection refused
    // This event shouldn't fire with our retry strategy, but just in case
  });

  // Try to connect (but don't fail if it doesn't)
  redis.connect().catch(() => {
    // Connection will be retried by retryStrategy
  });
}

module.exports = redis;

