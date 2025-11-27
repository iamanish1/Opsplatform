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
// Note: webhook routes are mounted in app.js with raw body parser

// Mount routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/lessons', lessonsRoutes);
router.use('/projects', projectRoutes);

module.exports = router;

