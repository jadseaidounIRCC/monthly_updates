const express = require('express');
const Joi = require('joi');
const { ReportingPeriod, Project, NextStep, Comment, ProjectData } = require('../models');
const logger = require('../config/logger');
const PeriodManagementService = require('../services/PeriodManagementService');

const router = express.Router();

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

// GET /api/periods - Get all periods in descending order
router.get('/', async (req, res) => {
  try {
    const periods = await PeriodManagementService.getAllPeriods();

    res.json({
      success: true,
      periods: periods.map(period => ({
        id: period.id,
        name: period.periodName,
        startDate: period.periodStart,
        endDate: period.periodEnd,
        isActive: period.isActive,
        isLocked: period.isLocked,
        lockedAt: period.lockedAt
      }))
    });

  } catch (error) {
    logger.error('Error fetching periods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reporting periods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/current - Get current active period
router.get('/current', async (req, res) => {
  try {
    const currentPeriod = await PeriodManagementService.getCurrentPeriod();

    if (!currentPeriod) {
      return res.status(404).json({
        success: false,
        message: 'No active period found'
      });
    }

    res.json({
      success: true,
      data: {
        id: currentPeriod.id,
        name: currentPeriod.periodName,
        startDate: currentPeriod.periodStart,
        endDate: currentPeriod.periodEnd,
        isActive: currentPeriod.isActive,
        isLocked: currentPeriod.isLocked
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

// GET /api/periods/next - Calculate what the next period would be
router.get('/next', async (req, res) => {
  try {
    const nextPeriod = await PeriodManagementService.calculateNextPeriod();

    res.json({
      success: true,
      data: nextPeriod,
      message: 'Next period calculated successfully'
    });

  } catch (error) {
    logger.error('Error calculating next period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate next period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/periods/create-next - Create new global period and copy all projects
router.post('/create-next', async (req, res) => {
  try {
    // Calculate what the next period will be
    const nextPeriodInfo = await PeriodManagementService.calculateNextPeriod();
    
    // Check if user confirms the creation
    const { confirmed = false } = req.body;
    
    if (!confirmed) {
      // Return preview of what will happen
      return res.json({
        success: true,
        preview: true,
        data: {
          nextPeriod: nextPeriodInfo,
          message: `This will create ${nextPeriodInfo.name} reporting period and copy all projects to it.`,
          actions: [
            'Lock all current active periods as read-only',
            'Create new period: ' + nextPeriodInfo.name,
            'Copy all projects to new period',
            'Set new period as active and editable'
          ]
        }
      });
    }

    // User confirmed - proceed with creation
    logger.info('Creating new reporting period', { 
      userId: req.userId || 'manual',
      nextPeriod: nextPeriodInfo 
    });

    const result = await PeriodManagementService.createNewPeriod(
      req.userId || 'manual',
      req
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully created ${result.newPeriod.name} period and copied ${result.copiedProjectsCount} projects`
    });

  } catch (error) {
    logger.error('Error creating new period:', error);
    
    let statusCode = 500;
    let message = 'Failed to create new reporting period';
    
    if (error.message.includes('already exists')) {
      statusCode = 409;
      message = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/:periodId/projects - Get all projects for a specific period
router.get('/:periodId/projects', async (req, res) => {
  try {
    const { periodId } = req.params;

    // Check if period exists
    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    const projects = await PeriodManagementService.getProjectsForPeriod(periodId);

    res.json({
      success: true,
      data: projects,
      meta: {
        periodId,
        periodName: period.periodName,
        projectCount: projects.length,
        isLocked: period.isLocked,
        isActive: period.isActive
      }
    });

  } catch (error) {
    logger.error('Error fetching projects for period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects for period',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/periods/:periodId - Get specific period details
router.get('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params;

    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    // Get project count for this period
    const projectDataCount = await ProjectData.count({
      where: { periodId },
      distinct: true,
      col: 'project_id'
    });

    res.json({
      success: true,
      data: {
        id: period.id,
        name: period.periodName,
        startDate: period.periodStart,
        endDate: period.periodEnd,
        isActive: period.isActive,
        isLocked: period.isLocked,
        lockedAt: period.lockedAt,
        createdAt: period.createdAt,
        updatedAt: period.updatedAt
      },
      meta: {
        projectCount: projectDataCount,
        dataSnapshot: period.isLocked ? !!period.dataSnapshot : null
      }
    });

  } catch (error) {
    logger.error('Error fetching period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reporting period',
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