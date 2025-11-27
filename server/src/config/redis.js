const Redis = require('ioredis');
const config = require('./index');

// Create Redis connection
// Supports REDIS_URL (for Upstash) or host/port fallback
let redis;

if (config.redis.url) {
  // Use REDIS_URL (for Upstash: redis://default:password@host:port)
  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Reconnect on READONLY error
      }
      return false;
    },
  });
} else {
  // Fallback to host/port
  redis = new Redis({
    host: config.redis.host,
    port: parseInt(config.redis.port, 10),
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
}

// Handle connection events
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('ready', () => {
  console.log('Redis ready');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

module.exports = redis;

