/**
 * Interview Request Routes
 * Interview request management
 */

const express = require('express');
const router = express.Router();
const interviewRequestController = require('../controllers/interviewRequest.controller');
const { authenticate, requireCompany, requireStudent } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { interviewRequestLimiter } = require('../middlewares/rateLimit.middleware');
const {
  createInterviewRequestValidation,
  interviewRequestIdValidation,
} = require('../dto/interviewRequest.dto');

/**
 * POST /api/interview-requests
 * Create interview request
 * Auth: Required (company role)
 */
router.post(
  '/',
  interviewRequestLimiter,
  authenticate,
  requireCompany,
  createInterviewRequestValidation,
  validate,
  interviewRequestController.createRequest
);

/**
 * GET /api/interview-requests
 * Get my interview requests (company sees sent, student sees received)
 * Auth: Required (company or student role)
 * Query: ?status=PENDING
 */
router.get('/', interviewRequestLimiter, authenticate, interviewRequestController.getMyRequests);

/**
 * POST /api/interview-requests/:id/accept
 * Accept interview request
 * Auth: Required (student role)
 */
router.post(
  '/:id/accept',
  authenticate,
  requireStudent,
  interviewRequestIdValidation,
  validate,
  interviewRequestController.acceptRequest
);

/**
 * POST /api/interview-requests/:id/reject
 * Reject interview request
 * Auth: Required (student role)
 */
router.post(
  '/:id/reject',
  authenticate,
  requireStudent,
  interviewRequestIdValidation,
  validate,
  interviewRequestController.rejectRequest
);

/**
 * POST /api/interview-requests/:id/cancel
 * Cancel interview request
 * Auth: Required (company role)
 */
router.post(
  '/:id/cancel',
  authenticate,
  requireCompany,
  interviewRequestIdValidation,
  validate,
  interviewRequestController.cancelRequest
);

/**
 * POST /api/interview-requests/:id/complete
 * Complete interview
 * Auth: Required (company role)
 */
router.post(
  '/:id/complete',
  authenticate,
  requireCompany,
  interviewRequestIdValidation,
  validate,
  interviewRequestController.completeRequest
);

module.exports = router;

