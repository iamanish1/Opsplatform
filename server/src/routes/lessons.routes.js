const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented in Phase 2
router.get('/', (req, res) => {
  res.json({ message: 'Lessons routes - Phase 2' });
});

module.exports = router;

