const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const reviewQueue = require('./review.queue');
const scoreQueue = require('./score.queue');
const portfolioQueue = require('./portfolio.queue');

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board with all queues
createBullBoard({
  queues: [
    new BullMQAdapter(reviewQueue),
    new BullMQAdapter(scoreQueue),
    new BullMQAdapter(portfolioQueue),
  ],
  serverAdapter: serverAdapter,
});

// Export router for mounting in app.js
const router = serverAdapter.getRouter();

module.exports = router;

