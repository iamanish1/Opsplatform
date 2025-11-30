/**
 * Interview Request Service
 * Handles interview request creation and management
 */

const interviewRequestRepo = require('../repositories/interviewRequest.repo');
const userRepo = require('../repositories/user.repo');
const companyRepo = require('../repositories/company.repo');

/**
 * Create interview request
 * @param {string} companyId - Company ID
 * @param {string} developerId - Developer user ID
 * @param {Object} requestData - Request data
 * @param {string} requestData.position - Position they are hiring for
 * @param {string} requestData.message - Message to candidate (optional)
 * @param {string} requestData.submissionId - Submission ID (optional)
 * @returns {Promise<Object>} Created interview request
 */
async function createRequest(companyId, developerId, requestData) {
  const { position, message, submissionId } = requestData;

  // Validate company exists
  const company = await companyRepo.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Validate developer exists
  const developer = await userRepo.findById(developerId);
  if (!developer) {
    throw new Error('Developer not found');
  }

  // Validate developer is a student
  if (developer.role !== 'STUDENT') {
    throw new Error('Can only request interviews from students');
  }

  // Validate developer is not the same as company owner
  if (company.userId === developerId) {
    throw new Error('Cannot request interview from yourself');
  }

  // Create interview request
  const request = await interviewRequestRepo.create({
    companyId,
    developerId,
    submissionId,
    position,
    message,
  });

  // Emit InterviewRequested event
  try {
    const eventBus = require('../utils/eventBus');
    eventBus.emit('InterviewRequested', {
      developerId,
      companyId,
      requestId: request.id,
    });
  } catch (eventError) {
    console.warn(`[Interview Request Service] Failed to emit InterviewRequested event: ${eventError.message}`);
    // Don't fail the request creation if event emission fails
  }

  return request;
}

/**
 * Get interview requests by company
 * @param {string} companyId - Company ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Array>} Array of interview requests
 */
async function getRequestsByCompany(companyId, filters = {}) {
  return interviewRequestRepo.findByCompanyId(companyId, filters);
}

/**
 * Get interview requests by developer
 * @param {string} developerId - Developer user ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Array>} Array of interview requests
 */
async function getRequestsByDeveloper(developerId, filters = {}) {
  return interviewRequestRepo.findByDeveloperId(developerId, filters);
}

/**
 * Accept interview request (developer action)
 * @param {string} requestId - Request ID
 * @param {string} developerId - Developer user ID
 * @returns {Promise<Object>} Updated interview request
 */
async function acceptRequest(requestId, developerId) {
  // Get request
  const request = await interviewRequestRepo.findById(requestId);
  if (!request) {
    throw new Error('Interview request not found');
  }

  // Validate request belongs to developer
  if (request.developerId !== developerId) {
    throw new Error('Unauthorized: This request does not belong to you');
  }

  // Validate status is PENDING
  if (request.status !== 'PENDING') {
    throw new Error(`Cannot accept request with status: ${request.status}`);
  }

  // Update status to ACCEPTED
  const updated = await interviewRequestRepo.updateStatus(requestId, 'ACCEPTED');

  // Emit InterviewAccepted event
  try {
    const eventBus = require('../utils/eventBus');
    eventBus.emit('InterviewAccepted', {
      companyId: request.companyId,
      developerId,
      requestId,
    });
  } catch (eventError) {
    console.warn(`[Interview Request Service] Failed to emit InterviewAccepted event: ${eventError.message}`);
  }

  return updated;
}

/**
 * Reject interview request (developer action)
 * @param {string} requestId - Request ID
 * @param {string} developerId - Developer user ID
 * @returns {Promise<Object>} Updated interview request
 */
async function rejectRequest(requestId, developerId) {
  // Get request
  const request = await interviewRequestRepo.findById(requestId);
  if (!request) {
    throw new Error('Interview request not found');
  }

  // Validate request belongs to developer
  if (request.developerId !== developerId) {
    throw new Error('Unauthorized: This request does not belong to you');
  }

  // Validate status is PENDING
  if (request.status !== 'PENDING') {
    throw new Error(`Cannot reject request with status: ${request.status}`);
  }

  // Update status to REJECTED
  const updated = await interviewRequestRepo.updateStatus(requestId, 'REJECTED');

  // Emit InterviewRejected event
  try {
    const eventBus = require('../utils/eventBus');
    eventBus.emit('InterviewRejected', {
      companyId: request.companyId,
      developerId,
      requestId,
    });
  } catch (eventError) {
    console.warn(`[Interview Request Service] Failed to emit InterviewRejected event: ${eventError.message}`);
  }

  return updated;
}

/**
 * Cancel interview request (company action)
 * @param {string} requestId - Request ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Updated interview request
 */
async function cancelRequest(requestId, companyId) {
  // Get request
  const request = await interviewRequestRepo.findById(requestId);
  if (!request) {
    throw new Error('Interview request not found');
  }

  // Validate request belongs to company
  if (request.companyId !== companyId) {
    throw new Error('Unauthorized: This request does not belong to your company');
  }

  // Validate status is PENDING or ACCEPTED
  if (request.status !== 'PENDING' && request.status !== 'ACCEPTED') {
    throw new Error(`Cannot cancel request with status: ${request.status}`);
  }

  // Update status to CANCELLED
  return interviewRequestRepo.updateStatus(requestId, 'CANCELLED');
}

/**
 * Complete interview (company action)
 * @param {string} requestId - Request ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Updated interview request
 */
async function completeRequest(requestId, companyId) {
  // Get request
  const request = await interviewRequestRepo.findById(requestId);
  if (!request) {
    throw new Error('Interview request not found');
  }

  // Validate request belongs to company
  if (request.companyId !== companyId) {
    throw new Error('Unauthorized: This request does not belong to your company');
  }

  // Validate status is ACCEPTED
  if (request.status !== 'ACCEPTED') {
    throw new Error(`Cannot complete interview with status: ${request.status}. Request must be ACCEPTED.`);
  }

  // Update status to COMPLETED
  return interviewRequestRepo.updateStatus(requestId, 'COMPLETED');
}

module.exports = {
  createRequest,
  getRequestsByCompany,
  getRequestsByDeveloper,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
};

