const { Sequelize } = require('sequelize');
const logger = require('./logger');

class DatabaseConfig {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const isLocal = process.env.DB_USE_LOCAL === 'True' || process.env.RUN_LOCAL === 'True';
      
      const dbConfig = {
        host: process.env.DB_HOSTNAME || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'monthly_updates',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        dialect: 'mysql',
        logging: (msg) => logger.debug('Sequelize: ' + msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
          timestamps: true,
          underscored: false,
          paranoid: false
        },
        dialectOptions: {
          charset: 'utf8mb4',
          dateStrings: true,
          typeCast: true,
          // SSL configuration for Azure MySQL
          ...(process.env.DB_SSL_MODE === 'require' && !isLocal ? {
            ssl: {
              rejectUnauthorized: false
            }
          } : {})
        },
        timezone: '+00:00'
      };

      this.sequelize = new Sequelize(dbConfig);
      
      // Test the connection
      await this.testConnection();
      
      logger.info('Database connection initialized successfully');
      return this.sequelize;
    } catch (error) {
      logger.error('Failed to initialize database connection:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      this.isConnected = true;
      logger.info('Database connection established successfully');
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error('Unable to connect to database:', {
        error: error.message,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      });
      throw error;
    }
  }

  async syncModels(options = {}) {
    try {
      if (!this.sequelize) {
        throw new Error('Database not initialized');
      }

      const syncOptions = {
        force: false,
        alter: false,
        ...options
      };

      if (process.env.NODE_ENV === 'development' && syncOptions.force) {
        logger.warn('WARNING: Database sync with force=true will drop all tables');
      }

      await this.sequelize.sync(syncOptions);
      logger.info('Database models synchronized successfully', syncOptions);
      return true;
    } catch (error) {
      logger.error('Failed to sync database models:', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  async close() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        this.isConnected = false;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error.message);
      throw error;
    }
  }

  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.sequelize;
  }

  isReady() {
    return this.isConnected && this.sequelize !== null;
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.sequelize) {
        return { status: 'error', message: 'Database not initialized' };
      }

      await this.sequelize.authenticate();
      
      // Test a simple query
      const [results] = await this.sequelize.query('SELECT 1 as test');
      
      return {
        status: 'healthy',
        message: 'Database connection is working',
        details: {
          connected: this.isConnected,
          dialect: this.sequelize.getDialect(),
          database: this.sequelize.getDatabaseName()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database health check failed',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = {
  databaseConfig,
  sequelize: () => databaseConfig.getSequelize()
};