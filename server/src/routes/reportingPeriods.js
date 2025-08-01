const express = require('express');
const Joi = require('joi');
const { ReportingPeriod, Project, NextStep, Comment } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const periodValidation = {
  create: Joi.object({
    projectId: Joi.string().length(36).required(),
    periodStart: Joi.date().iso().required(),
    periodEnd: Joi.date().iso().required(),
    periodName: Joi.string().max(50).required()
  }),
  
  update: Joi.object({
    periodName: Joi.string().max(50).optional()
  }),
  
  lock: Joi.object({
    includeProjectData: Joi.boolean().default(true),
    includeNextSteps: Joi.boolean().default(true),
    includeComments: Joi.boolean().default(true)
  })
};

// Request logging middleware
const logRequest = (req, res, next) => {
  logger.info(`Reporting Periods API: ${req.method} ${req.originalUrl}`, {
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
};

router.use(logRequest);

// GET /api/periods/project/:projectId - Get all periods for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { includeComments = 'false', includeNextSteps = 'false', page = 1, limit = 50 } = req.query;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const include = [];
    if (includeComments === 'true') {
      include.push({
        model: Comment,
        as: 'comments',
        attributes: ['id', 'fieldReference', 'authorName', 'isResolved', 'createdAt']
      });
    }
    
    if (includeNextSteps === 'true') {
      include.push({
        model: NextStep,
        as: 'nextSteps',
        attributes: ['id', 'description', 'status', 'owner', 'dueDate']
      });
    }

    const periods = await ReportingPeriod.findByProject(projectId, {
      include,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: periods,
      meta: {
        count: periods.length,
        projectId,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching project periods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reporting periods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/current/:projectId - Get current period for a project
router.get('/current/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    let currentPeriod = await ReportingPeriod.findCurrentPeriod(projectId);
    
    // If no current period exists, create one
    if (!currentPeriod) {
      const periodData = ReportingPeriod.calculatePeriodForDate();
      currentPeriod = await ReportingPeriod.createForProject(projectId, periodData, {
        userId: req.userId || 'system',
        req
      });
      
      logger.info('Created new current period', {
        projectId,
        periodId: currentPeriod.id,
        periodName: currentPeriod.periodName
      });
    }

    res.json({
      success: true,
      data: currentPeriod,
      meta: {
        projectId,
        isNewlyCreated: !currentPeriod.id
      }
    });

  } catch (error) {
    logger.error('Error fetching current period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/pending-locks - Get periods that should be locked
router.get('/pending-locks', async (req, res) => {
  try {
    const periods = await ReportingPeriod.findPendingLocks();

    res.json({
      success: true,
      data: periods,
      meta: {
        count: periods.length
      }
    });

  } catch (error) {
    logger.error('Error fetching pending locks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending locks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/calculate - Calculate period dates for a given date
router.get('/calculate', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const periodData = ReportingPeriod.calculatePeriodForDate(targetDate);

    res.json({
      success: true,
      data: periodData,
      meta: {
        inputDate: targetDate.toISOString(),
        description: '15th-to-15th monthly reporting cycle'
      }
    });

  } catch (error) {
    logger.error('Error calculating period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/:periodId - Get specific period by ID
router.get('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params;
    const { includeSnapshot = 'false' } = req.query;

    const period = await ReportingPeriod.findByPk(periodId, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    const response = {
      success: true,
      data: period.toJSON(),
      meta: {
        isLocked: period.isLocked,
        isCurrentPeriod: period.isCurrentPeriod(),
        shouldBeLocked: period.shouldBeLocked()
      }
    };

    // Only include snapshot data if explicitly requested and period is locked
    if (includeSnapshot === 'true' && period.isLocked && period.dataSnapshot) {
      response.data.dataSnapshot = period.dataSnapshot;
    } else {
      delete response.data.dataSnapshot;
    }

    res.json(response);

  } catch (error) {
    logger.error('Error fetching period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reporting period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/periods - Create a new reporting period
router.post('/', async (req, res) => {
  try {
    const { error, value } = periodValidation.create.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Validate project exists
    const project = await Project.findByPk(value.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check for overlapping periods
    const existingPeriod = await ReportingPeriod.findOne({
      where: {
        projectId: value.projectId,
        periodStart: value.periodStart,
        periodEnd: value.periodEnd
      }
    });

    if (existingPeriod) {
      return res.status(409).json({
        success: false,
        message: 'A reporting period with these dates already exists for this project'
      });
    }

    const period = await ReportingPeriod.create(value, {
      userId: req.userId || 'system',
      req
    });

    logger.info('Reporting period created successfully', {
      periodId: period.id,
      projectId: value.projectId,
      periodName: value.periodName
    });

    res.status(201).json({
      success: true,
      data: period,
      message: 'Reporting period created successfully'
    });

  } catch (error) {
    logger.error('Error creating reporting period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reporting period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/periods/:periodId - Update a reporting period
router.put('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params;
    const { error, value } = periodValidation.update.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    if (period.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify locked reporting period'
      });
    }

    await period.update(value, {
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      data: period,
      message: 'Reporting period updated successfully'
    });

  } catch (error) {
    logger.error('Error updating reporting period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reporting period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/periods/:periodId/lock - Lock a reporting period with data snapshot
router.post('/:periodId/lock', async (req, res) => {
  try {
    const { periodId } = req.params;
    const { error, value } = periodValidation.lock.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    if (period.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Reporting period is already locked'
      });
    }

    // Gather snapshot data
    const snapshotData = {};

    if (value.includeProjectData) {
      const project = await Project.findByPk(period.projectId);
      snapshotData.project = project ? project.toJSON() : null;
    }

    if (value.includeNextSteps) {
      const nextSteps = await NextStep.findByProject(period.projectId, period.id);
      snapshotData.nextSteps = nextSteps.map(step => step.toJSON());
    }

    if (value.includeComments) {
      const comments = await Comment.findByProject(period.projectId, period.id);
      snapshotData.comments = comments.map(comment => comment.toJSON());
    }

    snapshotData.lockedAt = new Date().toISOString();
    snapshotData.lockedBy = req.userId || 'system';

    // Lock the period with snapshot
    await period.lock(snapshotData, {
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      data: period,
      message: 'Reporting period locked successfully',
      meta: {
        snapshotSize: JSON.stringify(snapshotData).length,
        componentsIncluded: Object.keys(snapshotData).filter(key => key !== 'lockedAt' && key !== 'lockedBy')
      }
    });

  } catch (error) {
    logger.error('Error locking reporting period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock reporting period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/periods/auto-lock - Automatically lock all periods that should be locked
router.post('/auto-lock', async (req, res) => {
  try {
    const pendingPeriods = await ReportingPeriod.findPendingLocks();
    const results = {
      successful: [],
      failed: []
    };

    for (const period of pendingPeriods) {
      try {
        // Gather snapshot data for each period
        const snapshotData = {};

        const project = await Project.findByPk(period.projectId);
        snapshotData.project = project ? project.toJSON() : null;

        const nextSteps = await NextStep.findByProject(period.projectId, period.id);
        snapshotData.nextSteps = nextSteps.map(step => step.toJSON());

        const comments = await Comment.findByProject(period.projectId, period.id);
        snapshotData.comments = comments.map(comment => comment.toJSON());

        snapshotData.lockedAt = new Date().toISOString();
        snapshotData.lockedBy = 'auto-lock-system';

        await period.lock(snapshotData, {
          userId: 'auto-lock-system',
          req
        });

        results.successful.push({
          periodId: period.id,
          projectId: period.projectId,
          periodName: period.periodName
        });

      } catch (error) {
        results.failed.push({
          periodId: period.id,
          projectId: period.projectId,
          periodName: period.periodName,
          error: error.message
        });
        
        logger.error('Failed to auto-lock period:', {
          periodId: period.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Auto-lock completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      meta: {
        totalProcessed: pendingPeriods.length,
        successCount: results.successful.length,
        failureCount: results.failed.length
      }
    });

  } catch (error) {
    logger.error('Error in auto-lock process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-lock periods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/periods/:periodId - Delete a reporting period
router.delete('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params;
    const { force = 'false' } = req.query;

    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    if (period.isLocked && force !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete locked reporting period without force=true'
      });
    }

    await period.destroy({
      force: force === 'true',
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      message: 'Reporting period deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting reporting period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reporting period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Reporting Periods API error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;