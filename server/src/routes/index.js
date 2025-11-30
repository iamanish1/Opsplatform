const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ ok: true });
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

