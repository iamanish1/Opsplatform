const { Queue } = require('bullmq');
const redis = require('../config/redis');

// Eval queue — jobs dispatched to VPS3 for Docker execution + hidden tests
// Workers on VPS3 connect to the same Redis and process this queue exclusively
const evalQueue = new Queue('evalQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2, // Docker builds can fail transiently; one retry is enough
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    removeOnComplete: {
      age: 7200,   // 2 hours
      count: 500,
    },
    removeOnFail: {
      age: 86400,  // 24 hours — keep for post-mortem
    },
  },
});

evalQueue.on('error', (error) => {
  if (
    error.code === 'ECONNREFUSED' ||
    error.message?.includes('ECONNREFUSED')
  ) {
    return;
  }
  console.error('[Eval Queue] Error:', error.message);
});

module.exports = evalQueue;
