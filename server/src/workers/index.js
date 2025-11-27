/**
 * Worker Starter
 * Starts all workers for queue processing
 * Can be imported or run separately
 */

const reviewWorker = require('./review.worker');
const scoreWorker = require('./score.worker');
const portfolioWorker = require('./portfolio.worker');

console.log('All workers started:');
console.log('- Review Worker');
console.log('- Score Worker');
console.log('- Portfolio Worker');

// Export workers for potential programmatic access
module.exports = {
  reviewWorker,
  scoreWorker,
  portfolioWorker,
};

