/**
 * Scoring Service (Placeholder)
 * Actual implementation will be in later phase
 */

/**
 * Generate score for submission
 * @param {Object} jobData - Job data from queue
 * @returns {Promise<Object>} Score result
 */
async function generateScore(jobData) {
  console.log('Scoring service: generateScore called with:', {
    submissionId: jobData.submissionId,
  });

  // Placeholder: Return success
  // TODO: Implement scoring logic
  // - Compute total score from reviews
  // - Update submission.status = REVIEWED
  // - Save score to database
  // - Return score result with userId

  return {
    success: true,
    submissionId: jobData.submissionId,
    message: 'Score generation placeholder - to be implemented later',
  };
}

module.exports = {
  generateScore,
};

