const activeReviews = new Map();

function start(submissionId, message = 'Review started') {
  const now = new Date().toISOString();
  activeReviews.set(submissionId, {
    status: 'REVIEWING',
    progress: 10,
    step: 'queued',
    message,
    startedAt: now,
    updatedAt: now,
  });
}

function update(submissionId, progress, step, message) {
  const current = activeReviews.get(submissionId) || {};
  activeReviews.set(submissionId, {
    ...current,
    status: 'REVIEWING',
    progress: Math.max(0, Math.min(99, progress)),
    step,
    message,
    updatedAt: new Date().toISOString(),
  });
}

function complete(submissionId, message = 'Review complete') {
  const current = activeReviews.get(submissionId) || {};
  activeReviews.set(submissionId, {
    ...current,
    status: 'REVIEWED',
    progress: 100,
    step: 'complete',
    message,
    updatedAt: new Date().toISOString(),
  });
}

function fail(submissionId, error) {
  const current = activeReviews.get(submissionId) || {};
  activeReviews.set(submissionId, {
    ...current,
    status: 'ERROR',
    progress: current.progress || 0,
    step: 'failed',
    message: error?.message || 'Review failed',
    error: error?.message || 'Review failed',
    updatedAt: new Date().toISOString(),
  });
}

function get(submissionId) {
  return activeReviews.get(submissionId) || null;
}

function isRunning(submissionId) {
  return activeReviews.get(submissionId)?.status === 'REVIEWING';
}

module.exports = {
  start,
  update,
  complete,
  fail,
  get,
  isRunning,
};
