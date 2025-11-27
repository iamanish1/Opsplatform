const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const queueDashboard = require('./queues/dashboard');

const app = express();

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

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Queue dashboard (mount before other routes)
// TODO: Add authentication middleware for production
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

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;

