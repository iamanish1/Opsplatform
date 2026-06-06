const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to get :id from parent
const { authenticate } = require('../middlewares/auth.middleware');
const { requireStudent } = require('../middlewares/auth.middleware');
const reflectionController = require('../controllers/reflection.controller');

// All reflection routes require authentication and student role
router.use(authenticate);

// GET  /api/submissions/:id/reflection         — fetch questions
router.get('/', reflectionController.getReflectionQuestions);

// POST /api/submissions/:id/reflection         — submit answers
router.post('/', reflectionController.submitReflectionAnswers);

// GET  /api/submissions/:id/reflection/result  — get cross-check result
router.get('/result', reflectionController.getReflectionResult);

module.exports = router;
