const databaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    logger.info('Initializing PostgreSQL + Redis database service...');

    // Initialize the database service (PostgreSQL + Redis)
    await databaseService.initialize();
    logger.info('Database service initialized successfully');

  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  try {
    await databaseService.disconnect();
    logger.info('Database service disconnected');
  } catch (error) {
    logger.error('Database disconnection error:', error);
  }
};

module.exports = { connectDB, disconnectDB, databaseService };
