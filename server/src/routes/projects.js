const express = require('express');
const router = express.Router();
const { Project } = require('../models');
const {
  validateProject,
  validateParams,
  validateQuery,
  validateProjectExists
} = require('../middleware/validation');
const logger = require('../config/logger');

// GET /api/projects - List all projects
router.get('/',
  validateQuery.pagination,
  validateQuery.projectFilters,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'created_at',
        order = 'ASC',
        stage,
        aiStage,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (stage) {
        whereClause.currentProjectStage = stage;
      }

      if (aiStage) {
        whereClause.currentAiStage = aiStage;
      }

      if (search) {
        whereClause.name = {
          [Project.sequelize.Sequelize.Op.like]: `%${search}%`
        };
      }

      const { count, rows: projects } = await Project.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order]],
        // include: [
        //   {
        //     model: ReportingPeriod,
        //     as: 'reportingPeriods',
        //     limit: 1,
        //     order: [['period_start', 'DESC']]
        //   }
        // ]
      });

      const totalPages = Math.ceil(count / limit);

      logger.info('Projects listed', {
        count,
        page,
        totalPages,
        filters: { stage, aiStage, search }
      });

      res.json({
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          stage,
          aiStage,
          search
        }
      });

    } catch (error) {
      logger.error('Error listing projects:', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to list projects',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// GET /api/projects/:id - Get specific project
router.get('/:id',
  validateParams.id,
  validateProjectExists,
  async (req, res) => {
    try {
      const project = await Project.findByPk(req.params.id);
      // TODO: Add includes when other models are ready
      // const project = await Project.findByPk(req.params.id, {
      //   include: [
      //     {
      //       model: ReportingPeriod,
      //       as: 'reportingPeriods',
      //       order: [['period_start', 'DESC']],
      //       include: [
      //         {
      //           model: NextStep,
      //           as: 'nextSteps',
      //           order: [['created_at', 'ASC']]
      //         }
      //       ]
      //     }
      //   ]
      // });

      logger.info('Project retrieved', {
        projectId: req.params.id,
        projectName: project.name
      });

      res.json(project);

    } catch (error) {
      logger.error('Error retrieving project:', {
        projectId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to retrieve project',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// POST /api/projects - Create new project
router.post('/',
  validateProject.create,
  async (req, res) => {
    try {
      const projectData = req.body;

      // Create project
      const project = await Project.create(projectData);

      logger.auditLog('CREATE', 'projects', project.id, project.toJSON(), null, req);
      logger.info('Project created', {
        projectId: project.id,
        projectName: project.name
      });

      res.status(201).json(project);

    } catch (error) {
      logger.error('Error creating project:', {
        error: error.message,
        projectData: req.body
      });

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path,
            message: e.message
          })),
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        error: 'Failed to create project',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// PUT /api/projects/:id - Update project
router.put('/:id',
  validateParams.id,
  validateProject.update,
  validateProjectExists,
  async (req, res) => {
    try {
      const updateData = req.body;
      const project = req.project;

      // Store original data for audit
      const originalData = project.toJSON();

      // Update project
      await project.update(updateData);

      logger.auditLog('UPDATE', 'projects', project.id, {
        before: originalData,
        after: project.toJSON(),
        changes: Object.keys(updateData)
      }, null, req);

      logger.info('Project updated', {
        projectId: project.id,
        projectName: project.name,
        changedFields: Object.keys(updateData)
      });

      res.json(project);

    } catch (error) {
      logger.error('Error updating project:', {
        projectId: req.params.id,
        error: error.message,
        updateData: req.body
      });

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path,
            message: e.message
          })),
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        error: 'Failed to update project',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// DELETE /api/projects/:id - Delete project
router.delete('/:id',
  validateParams.id,
  validateProjectExists,
  async (req, res) => {
    try {
      const project = req.project;
      const projectName = project.name;

      await project.destroy();

      logger.auditLog('DELETE', 'projects', project.id, {
        name: projectName
      }, null, req);

      logger.info('Project deleted', {
        projectId: project.id,
        projectName
      });

      res.status(204).send();

    } catch (error) {
      logger.error('Error deleting project:', {
        projectId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to delete project',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// GET /api/projects/:id/summary - Get project summary
router.get('/:id/summary',
  validateParams.id,
  validateProjectExists,
  async (req, res) => {
    try {
      const project = req.project;

      const summary = {
        project: {
          id: project.id,
          name: project.name,
          currentProjectStage: project.currentProjectStage,
          currentAiStage: project.currentAiStage,
          lastUpdated: project.updatedAt
        },
        // TODO: Add when other models are implemented
        currentPeriod: null,
        nextSteps: { total: 0 },
        comments: { totalComments: 0, unresolvedComments: 0 }
      };

      logger.info('Project summary retrieved', {
        projectId: project.id,
        projectName: project.name
      });

      res.json(summary);

    } catch (error) {
      logger.error('Error retrieving project summary:', {
        projectId: req.params.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to retrieve project summary',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// POST /api/projects/migrate - Migrate from localStorage
router.post('/migrate',
  async (req, res) => {
    try {
      const { migrateFromLocalStorage } = require('../models');
      const localStorageData = req.body;

      if (!localStorageData || !localStorageData.projects) {
        return res.status(400).json({
          error: 'Invalid migration data',
          message: 'Expected localStorage data with projects array',
          timestamp: new Date().toISOString()
        });
      }

      const migrationResults = await migrateFromLocalStorage(localStorageData);

      logger.info('Migration completed', migrationResults);

      res.json({
        message: 'Migration completed successfully',
        results: migrationResults,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Migration failed:', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Migration failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;