const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');
const reviewQueue = require('./review.queue');
const scoreQueue = require('./score.queue');
const portfolioQueue = require('./portfolio.queue');
const notificationQueue = require('./notification.queue');

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board with all queues
createBullBoard({
  queues: [
    new BullMQAdapter(reviewQueue),
    new BullMQAdapter(scoreQueue),
    new BullMQAdapter(portfolioQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter: serverAdapter,
});

// Export router for mounting in app.js
// Add authentication middleware - require ADMIN role
const router = serverAdapter.getRouter();

// Apply authentication to all queue dashboard routes
router.use(authenticate);
router.use(requireAdmin);

module.exports = router;

