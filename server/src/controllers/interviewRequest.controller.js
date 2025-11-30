/**
 * Interview Request Controller
 * Handles interview request management
 */

const interviewRequestService = require('../services/interviewRequest.service');
const companyRepo = require('../repositories/company.repo');

/**
 * Create interview request
 * POST /api/interview-requests
 * Auth: Required (company role)
 */
async function createRequest(req, res, next) {
  try {
    const { developerId, position, message, submissionId } = req.body;

    // Validate required fields
    if (!developerId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'developerId is required',
        },
      });
    }

    if (!position) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'position is required',
        },
      });
    }

    // Get company ID from authenticated user
    const userId = req.user.id;
    const company = await companyRepo.findByUserId(userId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Company profile not found',
        },
      });
    }

    // Create request
    const request = await interviewRequestService.createRequest(
      company.id,
      developerId,
      {
        position,
        message,
        submissionId,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Interview request created successfully',
      request,
    });
  } catch (error) {
    if (
      error.message === 'Company not found' ||
      error.message === 'Developer not found' ||
      error.message === 'Can only request interviews from students' ||
      error.message === 'Cannot request interview from yourself'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Get my interview requests
 * GET /api/interview-requests
 * Auth: Required (company or student role)
 * Query: ?status=PENDING
 */
async function getMyRequests(req, res, next) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filters = {};
    if (status) {
      filters.status = status.toUpperCase();
    }

    let requests;

    if (req.user.role === 'COMPANY') {
      // Company sees requests they sent
      const company = await companyRepo.findByUserId(userId);
      if (!company) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Company profile not found',
          },
        });
      }
      requests = await interviewRequestService.getRequestsByCompany(company.id, filters);
    } else if (req.user.role === 'STUDENT') {
      // Student sees requests they received
      requests = await interviewRequestService.getRequestsByDeveloper(userId, filters);
    } else {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Accept interview request
 * POST /api/interview-requests/:id/accept
 * Auth: Required (student role)
 */
async function acceptRequest(req, res, next) {
  try {
    const { id } = req.params;
    const developerId = req.user.id;

    const request = await interviewRequestService.acceptRequest(id, developerId);

    res.status(200).json({
      success: true,
      message: 'Interview request accepted',
      request,
    });
  } catch (error) {
    if (
      error.message === 'Interview request not found' ||
      error.message === 'Unauthorized: This request does not belong to you' ||
      error.message.startsWith('Cannot accept request with status')
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Reject interview request
 * POST /api/interview-requests/:id/reject
 * Auth: Required (student role)
 */
async function rejectRequest(req, res, next) {
  try {
    const { id } = req.params;
    const developerId = req.user.id;

    const request = await interviewRequestService.rejectRequest(id, developerId);

    res.status(200).json({
      success: true,
      message: 'Interview request rejected',
      request,
    });
  } catch (error) {
    if (
      error.message === 'Interview request not found' ||
      error.message === 'Unauthorized: This request does not belong to you' ||
      error.message.startsWith('Cannot reject request with status')
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Cancel interview request
 * POST /api/interview-requests/:id/cancel
 * Auth: Required (company role)
 */
async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get company ID
    const company = await companyRepo.findByUserId(userId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Company profile not found',
        },
      });
    }

    const request = await interviewRequestService.cancelRequest(id, company.id);

    res.status(200).json({
      success: true,
      message: 'Interview request cancelled',
      request,
    });
  } catch (error) {
    if (
      error.message === 'Interview request not found' ||
      error.message === 'Unauthorized: This request does not belong to your company' ||
      error.message.startsWith('Cannot cancel request with status')
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Complete interview
 * POST /api/interview-requests/:id/complete
 * Auth: Required (company role)
 */
async function completeRequest(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get company ID
    const company = await companyRepo.findByUserId(userId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Company profile not found',
        },
      });
    }

    const request = await interviewRequestService.completeRequest(id, company.id);

    res.status(200).json({
      success: true,
      message: 'Interview marked as completed',
      request,
    });
  } catch (error) {
    if (
      error.message === 'Interview request not found' ||
      error.message === 'Unauthorized: This request does not belong to your company' ||
      error.message.startsWith('Cannot complete interview with status')
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
};

