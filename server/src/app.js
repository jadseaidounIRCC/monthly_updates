require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./config/logger');
const { databaseConfig } = require('./config/database');

// Import routes (models will be loaded after database initialization)
// const projectRoutes = require('./routes/projects');
// const periodRoutes = require('./routes/periods');
// const commentRoutes = require('./routes/comments');

class MonthlyUpdatesServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Initialize database
      await databaseConfig.initialize();
      
      // Initialize models
      const { initializeModels } = require('./models');
      await initializeModels();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for now, enable in production
      crossOriginEmbedderPolicy: false
    }));

    // Compression
    this.app.use(compression());

    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
      }
    });
    this.app.use('/api/', limiter);

    // Request logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim())
        }
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });

    // Request logging with structured data
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        logger.logRequest(req, res, responseTime);
      });
      
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', async (req, res) => {
      try {
        const dbHealth = await databaseConfig.healthCheck();
        
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
          version: require('../package.json').version,
          database: dbHealth
        };

        res.status(200).json(health);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    // API routes (load after models are initialized)
    const projectRoutes = require('./routes/projects');
    const periodRoutes = require('./routes/reportingPeriods');
    const commentRoutes = require('./routes/comments');
    const userRoutes = require('./routes/users');
    
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/periods', periodRoutes);
    this.app.use('/api/comments', commentRoutes);
    this.app.use('/api/users', userRoutes);

    // Static file serving for frontend (in production)
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static('../'));
      
      // Serve frontend for any non-API routes
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../index.html'));
      });
    }

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      logger.logError(error, {
        errorId,
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Don't expose internal errors in production
      const isProduction = process.env.NODE_ENV === 'production';
      const statusCode = error.statusCode || error.status || 500;
      
      const errorResponse = {
        error: isProduction && statusCode === 500 ? 'Internal server error' : error.message,
        errorId,
        timestamp: new Date().toISOString()
      };

      if (!isProduction) {
        errorResponse.stack = error.stack;
        errorResponse.details = error.details || null;
      }

      res.status(statusCode).json(errorResponse);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', {
        reason: reason.toString(),
        stack: reason.stack,
        promise: promise.toString()
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
      });
      
      // Graceful shutdown on uncaught exception
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  }

  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`, {
          environment: process.env.NODE_ENV,
          port: this.port,
          cors: process.env.CORS_ORIGIN
        });
      });

      // Graceful shutdown handlers
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown`);

    try {
      // Stop accepting new requests
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Close database connections
      await databaseConfig.close();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new MonthlyUpdatesServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = MonthlyUpdatesServer;