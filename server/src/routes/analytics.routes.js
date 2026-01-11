const express = require('express');
const AnalyticsService = require('../services/review/analytics.service');
const logger = require('../utils/logger');

const router = express.Router();
const analyticsService = new AnalyticsService();

/**
 * GET /api/analytics/trends
 * Get review trends for the past N days
 * Query: ?days=7
 */
router.get('/trends', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const trends = await analyticsService.getReviewTrends(days);

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get review trends');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/categories
 * Get category performance metrics
 * Query: ?days=7
 */
router.get('/categories', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const performance = await analyticsService.getCategoryPerformance(days);

    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get category performance');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/models
 * Get model usage statistics
 */
router.get('/models', async (req, res) => {
  try {
    const usage = await analyticsService.getModelUsage();

    res.json({
      success: true,
      data: usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get model usage');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model usage',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/health
 * Get system health check metrics
 */
router.get('/health', async (req, res) => {
  try {
    const health = await analyticsService.getHealthCheck();

    // Determine HTTP status based on health status
    const statusCode = health.status === 'operational' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'operational',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get health check');
    res.status(503).json({
      success: false,
      status: 'error',
      error: 'Failed to fetch health metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/summary
 * Get comprehensive analytics summary
 * Query: ?days=7
 */
router.get('/summary', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);

    // Fetch all analytics in parallel
    const [trends, performance, usage, health] = await Promise.all([
      analyticsService.getReviewTrends(days),
      analyticsService.getCategoryPerformance(days),
      analyticsService.getModelUsage(),
      analyticsService.getHealthCheck()
    ]);

    res.json({
      success: true,
      data: {
        trends,
        performance,
        usage,
        health,
        period: `${days} days`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get analytics summary');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/status
 * Quick status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const health = await analyticsService.getHealthCheck();

    res.json({
      status: health.status,
      timestamp: health.timestamp,
      operational: health.status === 'operational',
      today: health.today
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
