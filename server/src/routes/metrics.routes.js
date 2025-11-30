const express = require('express');
const router = express.Router();
const { register } = require('../utils/metrics');

/**
 * GET /metrics
 * Prometheus metrics endpoint
 * No authentication required (typically accessed by Prometheus server)
 */
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

module.exports = router;

