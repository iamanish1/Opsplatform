require('dotenv').config();
const app = require('./app');
const config = require('./config');
const prisma = require('./prisma/client');
const logger = require('./utils/logger');

// Prevent unhandled rejections/exceptions from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason: reason?.message || reason, stack: reason?.stack }, 'Unhandled promise rejection — not crashing');
});

process.on('uncaughtException', (error) => {
  logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception — not crashing');
});

const PORT = config.port;

// Test database connection with retry
async function testDatabaseConnection(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✓ Database connected successfully');
      return;
    } catch (error) {
      console.error(`✗ Database connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// Start server
async function startServer() {
  try {
    // Test database connection first
    await testDatabaseConnection();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start queue workers in the same process
// In production, set WORKERS_ENABLED=false to run workers as separate PM2 processes
if (process.env.WORKERS_ENABLED !== 'false') {
  require('./workers');
}

// Start the server
startServer();

