// Onboarding step constants
const ONBOARDING_STEPS = {
  ACCOUNT_CREATED: 0,
  GITHUB_CONNECTED: 1,
  LESSONS_COMPLETED: 2,
  PROJECT_STARTED: 3,
  SUBMISSION_REVIEWED: 4,
};

// User roles
const USER_ROLES = {
  STUDENT: 'STUDENT',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
};

// Badge types
const BADGE_TYPES = {
  RED: 'RED',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
};

// Onboarding step meanings
const ONBOARDING_STEP_MEANINGS = {
  0: 'Account created (signed up)',
  1: 'GitHub connected',
  2: 'Lessons completed (prep done)',
  3: 'Project started / submission created',
  4: 'Submission reviewed / portfolio available',
};

module.exports = {
  ONBOARDING_STEPS,
  USER_ROLES,
  BADGE_TYPES,
  ONBOARDING_STEP_MEANINGS,
};

