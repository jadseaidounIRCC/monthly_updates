const { Sequelize } = require('sequelize');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');

class DatabaseConfig {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
    this.dbType = null; // 'mysql' or 'sqlite'
  }

  async initialize() {
    try {
      // Check if we should force SQLite
      const forceSQLite = process.env.USE_SQLITE === 'true' || process.env.DATABASE_TYPE === 'sqlite';
      
      // Check if we should force MySQL
      const forceMySQL = process.env.USE_MYSQL === 'true' || process.env.DATABASE_TYPE === 'mysql';
      
      let sequelizeInstance = null;
      
      // Try MySQL first (unless SQLite is forced)
      if (!forceSQLite) {
        sequelizeInstance = await this.tryMySQL();
      }
      
      // Fall back to SQLite if MySQL fails or is not forced
      if (!sequelizeInstance && !forceMySQL) {
        sequelizeInstance = await this.setupSQLite();
      }
      
      if (!sequelizeInstance) {
        throw new Error('Could not initialize any database connection');
      }
      
      this.sequelize = sequelizeInstance;
      
      // Test the connection
      await this.testConnection();
      
      logger.info(`Database connection initialized successfully (${this.dbType})`);
      return this.sequelize;
    } catch (error) {
      logger.error('Failed to initialize database connection:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async tryMySQL() {
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

      const sequelize = new Sequelize(dbConfig);
      
      // Test MySQL connection
      await sequelize.authenticate();
      
      this.dbType = 'mysql';
      logger.info('Successfully connected to MySQL database');
      return sequelize;
      
    } catch (error) {
      logger.warn('MySQL connection failed, will try SQLite:', error.message);
      return null;
    }
  }

  async setupSQLite() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        logger.info('Created data directory for SQLite database');
      }
      
      const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'monthly_updates.db');
      
      const dbConfig = {
        dialect: 'sqlite',
        storage: dbPath,
        logging: process.env.NODE_ENV === 'development' 
          ? (msg) => logger.debug('Sequelize: ' + msg)
          : false,
        define: {
          timestamps: true,
          underscored: false,
          paranoid: false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      };

      const sequelize = new Sequelize(dbConfig);
      
      // Test SQLite connection
      await sequelize.authenticate();
      
      this.dbType = 'sqlite';
      logger.info(`Successfully connected to SQLite database at: ${dbPath}`);
      
      // Enable foreign keys for SQLite
      await sequelize.query('PRAGMA foreign_keys = ON');
      
      return sequelize;
      
    } catch (error) {
      logger.error('SQLite setup failed:', error.message);
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
        dbType: this.dbType
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

  getDatabaseType() {
    return this.dbType;
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.sequelize) {
        return { status: 'error', message: 'Database not initialized' };
      }

      await this.sequelize.authenticate();
      
      // Test a simple query (works for both MySQL and SQLite)
      const testQuery = this.dbType === 'sqlite' 
        ? 'SELECT 1 as test' 
        : 'SELECT 1 as test';
      const [results] = await this.sequelize.query(testQuery);
      
      return {
        status: 'healthy',
        message: 'Database connection is working',
        details: {
          connected: this.isConnected,
          dialect: this.sequelize.getDialect(),
          database: this.dbType === 'sqlite' 
            ? 'SQLite file' 
            : this.sequelize.getDatabaseName(),
          type: this.dbType
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