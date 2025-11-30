const express = require('express');
const router = express.Router();
const metricsRoutes = require('./metrics.routes');

// Metrics endpoint (before other routes)
router.use('/metrics', metricsRoutes);

// Health check endpoint
router.get('/health', async (req, res) => {
  const prisma = require('../prisma/client');
  const redis = require('../config/redis');
  const logger = require('../utils/logger');

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  let allHealthy = true;

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (error) {
    logger.error({ error: error.message }, 'Database health check failed');
    health.checks.database = 'error';
    allHealthy = false;
  }

  // Check Redis connection
  try {
    await redis.ping();
    health.checks.redis = 'ok';
  } catch (error) {
    logger.error({ error: error.message }, 'Redis health check failed');
    health.checks.redis = 'error';
    // Redis is optional, don't fail health check if Redis is down
  }

  if (!allHealthy) {
    health.status = 'degraded';
    return res.status(503).json(health);
  }

  res.json(health);
});

// Import and use other route files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const lessonsRoutes = require('./lessons.routes');
const projectRoutes = require('./project.routes');
const submissionRoutes = require('./submission.routes');
const scoringRoutes = require('./scoring.routes');
const portfolioRoutes = require('./portfolio.routes');
const companyRoutes = require('./company.routes');
const talentRoutes = require('./talent.routes');
const interviewRequestRoutes = require('./interviewRequest.routes');
const notificationRoutes = require('./notification.routes');
// Note: webhook routes are mounted in app.js with raw body parser

// Mount routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/lessons', lessonsRoutes);
router.use('/projects', projectRoutes);
router.use('/submissions', submissionRoutes);
router.use('/internal/score', scoringRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/company', companyRoutes);
router.use('/company/talent-feed', talentRoutes);
router.use('/interview-requests', interviewRequestRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

