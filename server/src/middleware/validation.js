const Joi = require('joi');
const logger = require('../config/logger');

// Validation error formatter
const formatValidationError = (error) => {
  const details = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context.value
  }));

  return {
    error: 'Validation failed',
    details,
    timestamp: new Date().toISOString()
  };
};

// Generic validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      logger.warn('Validation failed', {
        requestId: req.requestId,
        property,
        errors: error.details.map(d => d.message)
      });

      return res.status(400).json(formatValidationError(error));
    }

    req[property] = value;
    next();
  };
};

// Project validation schemas
const projectSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Project name cannot be empty',
        'string.max': 'Project name must be less than 255 characters',
        'any.required': 'Project name is required'
      }),
    description: Joi.string().trim().allow('').optional(),
    businessLead: Joi.string().trim().max(255).allow('').optional(),
    initiator: Joi.string().trim().max(255).allow('').optional(),
    devTeamLead: Joi.string().trim().max(255).allow('').optional(),
    projectStartDate: Joi.date().iso().allow(null).optional(),
    currentProjectStage: Joi.string().valid('prototype', 'poc', 'pilot').allow(null).optional(),
    currentAiStage: Joi.string().valid(
      'planning-design',
      'data-collection',
      'model-building',
      'testing-validation',
      'deployment',
      'monitoring'
    ).allow(null).optional(),
    targetNextStageDate: Joi.date().iso().allow(null).optional(),
    targetCompletionDate: Joi.date().iso().allow(null).optional(),
    budget: Joi.string().trim().max(255).allow('').optional(),
    benefits: Joi.object({
      fteSavings: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      costSavings: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      programIntegrity: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      clientService: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      other: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional()
    }).optional(),
    keyRisks: Joi.string().allow('').optional(),
    keyUpdates: Joi.string().allow('').optional()
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(255).optional(),
    description: Joi.string().trim().allow('').optional(),
    businessLead: Joi.string().trim().max(255).allow('').optional(),
    initiator: Joi.string().trim().max(255).allow('').optional(),
    devTeamLead: Joi.string().trim().max(255).allow('').optional(),
    projectStartDate: Joi.date().iso().allow(null).optional(),
    currentProjectStage: Joi.string().valid('prototype', 'poc', 'pilot').allow(null).optional(),
    currentAiStage: Joi.string().valid(
      'planning-design',
      'data-collection',
      'model-building',
      'testing-validation',
      'deployment',
      'monitoring'
    ).allow(null).optional(),
    targetNextStageDate: Joi.date().iso().allow(null).optional(),
    targetCompletionDate: Joi.date().iso().allow(null).optional(),
    budget: Joi.string().trim().max(255).allow('').optional(),
    benefits: Joi.object({
      fteSavings: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      costSavings: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      programIntegrity: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      clientService: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional(),
      other: Joi.object({
        applicable: Joi.string().valid('', 'yes', 'no').allow('').optional(),
        details: Joi.string().allow('').optional()
      }).optional()
    }).optional(),
    keyRisks: Joi.string().allow('').optional(),
    keyUpdates: Joi.string().allow('').optional()
  }).min(1)
};

// Next Step validation schemas
const nextStepSchemas = {
  create: Joi.object({
    description: Joi.string().trim().min(1).required()
      .messages({
        'string.empty': 'Description cannot be empty',
        'any.required': 'Description is required'
      }),
    owner: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Owner cannot be empty',
        'any.required': 'Owner is required'
      }),
    dueDate: Joi.date().iso().allow(null).optional(),
    status: Joi.string().valid('not-started', 'in-progress', 'ongoing', 'blocked', 'completed')
      .default('not-started').optional()
  }),

  update: Joi.object({
    description: Joi.string().trim().min(1).optional(),
    owner: Joi.string().trim().min(1).max(255).optional(),
    dueDate: Joi.date().iso().allow(null).optional(),
    status: Joi.string().valid('not-started', 'in-progress', 'ongoing', 'blocked', 'completed').optional()
  }).min(1)
};

// Comment validation schemas
const commentSchemas = {
  create: Joi.object({
    fieldReference: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Field reference cannot be empty',
        'any.required': 'Field reference is required'
      }),
    authorName: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.empty': 'Author name cannot be empty',
        'any.required': 'Author name is required'
      }),
    content: Joi.string().trim().min(1).required()
      .messages({
        'string.empty': 'Comment content cannot be empty',
        'any.required': 'Comment content is required'
      }),
    parentCommentId: Joi.string().trim().allow(null).optional()
  }),

  update: Joi.object({
    content: Joi.string().trim().min(1).optional(),
    isResolved: Joi.boolean().optional(),
    resolvedBy: Joi.string().trim().max(255).allow('').optional()
  }).min(1)
};

// Parameter validation schemas
const paramSchemas = {
  id: Joi.object({
    id: Joi.string().trim().min(1).required()
      .messages({
        'string.empty': 'ID cannot be empty',
        'any.required': 'ID is required'
      })
  })
};

// Query validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    sort: Joi.string().valid('name', 'created_at', 'updated_at').default('created_at').optional(),
    order: Joi.string().valid('ASC', 'DESC').default('ASC').optional()
  }),

  projectFilters: Joi.object({
    stage: Joi.string().valid('prototype', 'poc', 'pilot').optional(),
    aiStage: Joi.string().valid(
      'planning-design',
      'data-collection',
      'model-building',
      'testing-validation',
      'deployment',
      'monitoring'
    ).optional(),
    search: Joi.string().trim().max(255).optional()
  }),

  commentFilters: Joi.object({
    fieldReference: Joi.string().trim().max(100).optional(),
    authorName: Joi.string().trim().max(255).optional(),
    resolved: Joi.boolean().optional(),
    includeReplies: Joi.boolean().default(true).optional()
  })
};

// Validation middleware creators
const validateProject = {
  create: validate(projectSchemas.create),
  update: validate(projectSchemas.update)
};

const validateNextStep = {
  create: validate(nextStepSchemas.create),
  update: validate(nextStepSchemas.update)
};

const validateComment = {
  create: validate(commentSchemas.create),
  update: validate(commentSchemas.update)
};

const validateParams = {
  id: validate(paramSchemas.id, 'params')
};

const validateQuery = {
  pagination: validate(querySchemas.pagination, 'query'),
  projectFilters: validate(querySchemas.projectFilters, 'query'),
  commentFilters: validate(querySchemas.commentFilters, 'query')
};

// Custom validation middleware
const validateProjectExists = async (req, res, next) => {
  try {
    const { Project } = require('../models');
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        projectId: req.params.id,
        timestamp: new Date().toISOString()
      });
    }
    
    req.project = project;
    next();
  } catch (error) {
    logger.error('Error validating project existence:', {
      projectId: req.params.id,
      error: error.message
    });
    
    return res.status(500).json({
      error: 'Failed to validate project',
      timestamp: new Date().toISOString()
    });
  }
};

const validatePeriodExists = async (req, res, next) => {
  try {
    const { ReportingPeriod } = require('../models');
    const period = await ReportingPeriod.findByPk(req.params.periodId);
    
    if (!period) {
      return res.status(404).json({
        error: 'Reporting period not found',
        periodId: req.params.periodId,
        timestamp: new Date().toISOString()
      });
    }
    
    req.period = period;
    next();
  } catch (error) {
    logger.error('Error validating period existence:', {
      periodId: req.params.periodId,
      error: error.message
    });
    
    return res.status(500).json({
      error: 'Failed to validate reporting period',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  validate,
  validateProject,
  validateNextStep,
  validateComment,
  validateParams,
  validateQuery,
  validateProjectExists,
  validatePeriodExists,
  formatValidationError
};