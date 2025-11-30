export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'DevHubs';

// User roles
export enum UserRole {
  STUDENT = 'STUDENT',
  COMPANY = 'COMPANY',
  ADMIN = 'ADMIN',
}

// Badge types
export enum Badge {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
}

// Submission status
export enum SubmissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
}

// Interview request status
export enum InterviewRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

