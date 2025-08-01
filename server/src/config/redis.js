const redis = require('redis');
const logger = require('./logger');

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const redisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      };

      // Remove password if empty string
      if (!redisOptions.password) {
        delete redisOptions.password;
      }

      this.client = redis.createClient(redisOptions);
      
      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis connection established');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', {
          error: error.message,
          stack: error.stack
        });
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      // Connect to Redis
      await this.client.connect();
      
      logger.info('Redis client initialized successfully');
      return this.client;
    } catch (error) {
      logger.error('Failed to initialize Redis client:', {
        error: error.message,
        stack: error.stack
      });
      
      // Continue without Redis if it's not available
      logger.warn('Continuing without Redis cache - performance may be affected');
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        logger.info('Redis client disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Redis client:', error.message);
    }
  }

  isReady() {
    return this.isConnected && this.client !== null;
  }

  getClient() {
    return this.client;
  }

  // Cache helper methods
  async get(key) {
    try {
      if (!this.isReady()) {
        logger.debug('Redis not available, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(value);
      }
      
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Redis get error:', {
        key,
        error: error.message
      });
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      if (!this.isReady()) {
        logger.debug('Redis not available, skipping cache set');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serializedValue);
      
      logger.debug(`Cache set for key: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      logger.error('Redis set error:', {
        key,
        error: error.message
      });
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isReady()) {
        logger.debug('Redis not available, skipping cache delete');
        return false;
      }

      const result = await this.client.del(key);
      logger.debug(`Cache delete for key: ${key} (deleted: ${result})`);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error:', {
        key,
        error: error.message
      });
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Redis exists error:', {
        key,
        error: error.message
      });
      return false;
    }
  }

  async expire(key, ttlSeconds) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error:', {
        key,
        ttlSeconds,
        error: error.message
      });
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.client) {
        return { 
          status: 'disabled', 
          message: 'Redis client not initialized' 
        };
      }

      if (!this.isConnected) {
        return { 
          status: 'error', 
          message: 'Redis client not connected' 
        };
      }

      // Test with a simple ping
      const pong = await this.client.ping();
      
      return {
        status: 'healthy',
        message: 'Redis connection is working',
        response: pong
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Redis health check failed',
        error: error.message
      };
    }
  }

  // Cache key generators
  generateProjectKey(projectId) {
    return `project:${projectId}`;
  }

  generateProjectsListKey() {
    return 'projects:list';
  }

  generatePeriodKey(periodId) {
    return `period:${periodId}`;
  }

  generateProjectPeriodsKey(projectId) {
    return `project:${projectId}:periods`;
  }

  generateCommentsKey(projectId, periodId, fieldReference) {
    return `comments:${projectId}:${periodId}:${fieldReference}`;
  }
}

// Create singleton instance
const redisConfig = new RedisConfig();

module.exports = {
  redisConfig,
  cache: () => redisConfig
};