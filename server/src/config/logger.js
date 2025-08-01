const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: {
    service: 'monthly-updates-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 2
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 2
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug'
  }));
}

// Add production-specific transports
if (process.env.NODE_ENV === 'production') {
  // Add any production-specific transports here
  // For example, external logging services like Azure Application Insights
}

// Helper methods for structured logging
logger.logActivity = (activity, details = {}) => {
  logger.info('Activity logged', {
    activity,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous'
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Warning/Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  });
};

logger.logDatabaseOperation = (operation, table, recordId, changes = {}) => {
  logger.info('Database Operation', {
    operation,
    table,
    recordId,
    changes,
    timestamp: new Date().toISOString()
  });
};

// Audit logging method (as required by user instructions)
logger.auditLog = (action, table, recordId, changes = {}, userId = null, req = null) => {
  const auditData = {
    action,
    table,
    recordId,
    changes,
    userId,
    timestamp: new Date().toISOString()
  };

  if (req) {
    auditData.ip = req.ip || req.connection.remoteAddress;
    auditData.userAgent = req.get('User-Agent');
  }

  logger.info('AUDIT', auditData);
};

module.exports = logger;