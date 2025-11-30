const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const config = require('../config');

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    integrations: [
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.SENTRY_RELEASE || undefined,
    // Filter out health check endpoints
    beforeSend(event, hint) {
      // Don't send events for health checks
      if (event.request?.url?.includes('/health') || event.request?.url?.includes('/metrics')) {
        return null;
      }
      return event;
    },
  });
}

module.exports = Sentry;

