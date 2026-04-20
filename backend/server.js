const app = require('./app');
const db = require('./database');
const logger = require('./utils/logger');
const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

// Graceful shutdown handler for Cloud Run (SIGTERM)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    if (db.mongoose) {
      await db.mongoose.close();
      logger.info('MongoDB connection closed.');
    }
    process.exit(0);
  });
});
