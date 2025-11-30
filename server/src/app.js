const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Sentry = require('./utils/sentry');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const queueDashboard = require('./queues/dashboard');
const {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors,
} = require('./utils/metrics');

const app = express();

// Sentry request handler (must be first)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors());

// Body parsing middleware
// Webhook routes need raw body for signature verification
// Mount webhook routes with raw body parser before JSON parser
const webhookRoutes = require('./routes/webhook.routes');
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Regular JSON body parsing for other routes (must come after webhook routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware - track HTTP requests
app.use((req, res, next) => {
  const start = Date.now();
  const route = req.route ? req.route.path : req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: route || req.path,
      status_code: res.statusCode,
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrors.inc(labels);
    }
  });

  next();
});

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Queue dashboard (mount before other routes)
// Authentication is handled in dashboard.js (requires ADMIN role)
app.use('/admin/queues', queueDashboard);

// Other routes (auth, user, etc.)
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'DevHubs Backend API',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  });
});

// Sentry error handler (before custom error handler)
app.use(Sentry.Handlers.errorHandler());

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;

