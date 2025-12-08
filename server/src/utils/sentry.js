const Sentry = require('@sentry/node');
const config = require('../config');

// Try to load profiling integration (optional - requires native compilation)
let ProfilingIntegration = null;
try {
  ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
} catch (error) {
  // Profiling integration not available (e.g., native compilation failed)
  // This is fine - Sentry will work without profiling
  console.warn('Sentry profiling integration not available:', error.message);
}

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  const integrations = [];
  
  // Add profiling integration only if available
  if (ProfilingIntegration) {
    integrations.push(new ProfilingIntegration());
  }
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    integrations: integrations.length > 0 ? integrations : undefined,
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling (only used if ProfilingIntegration is available)
    profilesSampleRate: ProfilingIntegration 
      ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0)
      : undefined,
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

