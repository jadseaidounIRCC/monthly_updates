const { sequelize } = require('../config/database');
const logger = require('../config/logger');

// Import model definitions
const defineProjectModel = require('./Project');
const defineReportingPeriodModel = require('./ReportingPeriod');
const defineNextStepModel = require('./NextStep');
const defineCommentModel = require('./Comment');
const defineUserModel = require('./User');
const defineProjectDataModel = require('./ProjectData');

// Models will be stored here after initialization
let models = {};

// Initialize all models and associations
const initializeModels = async () => {
  try {
    const sequelizeInstance = sequelize();
    
    // Define all models
    models.Project = defineProjectModel(sequelizeInstance);
    models.ReportingPeriod = defineReportingPeriodModel(sequelizeInstance);
    models.NextStep = defineNextStepModel(sequelizeInstance);
    models.Comment = defineCommentModel(sequelizeInstance);
    models.User = defineUserModel(sequelizeInstance);
    models.ProjectData = defineProjectDataModel(sequelizeInstance);
    
    // Setup associations
    setupAssociations();
    
    // Skip auto-sync since we have proper migration scripts
    // Models are already synced via migrations
    logger.info('Models initialized (using migrations, not auto-sync)');
    
    logger.info('Models initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize models:', error);
    throw error;
  }
};

// Define associations
const setupAssociations = () => {
  // Project -> ProjectData (1:many) - period-specific project data
  models.Project.hasMany(models.ProjectData, {
    foreignKey: 'project_id',
    as: 'projectData',
    onDelete: 'CASCADE'
  });
  
  models.ProjectData.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // ReportingPeriod -> ProjectData (1:many) - all projects in this period
  models.ReportingPeriod.hasMany(models.ProjectData, {
    foreignKey: 'period_id',
    as: 'projectData',
    onDelete: 'CASCADE'
  });
  
  models.ProjectData.belongsTo(models.ReportingPeriod, {
    foreignKey: 'period_id',
    as: 'reportingPeriod'
  });

  // Project -> NextSteps (1:many)
  models.Project.hasMany(models.NextStep, {
    foreignKey: 'project_id',
    as: 'nextSteps',
    onDelete: 'CASCADE'
  });
  
  models.NextStep.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // ReportingPeriod -> NextSteps (1:many)
  models.ReportingPeriod.hasMany(models.NextStep, {
    foreignKey: 'period_id',
    as: 'nextSteps',
    onDelete: 'CASCADE'
  });
  
  models.NextStep.belongsTo(models.ReportingPeriod, {
    foreignKey: 'period_id',
    as: 'reportingPeriod'
  });

  // Project -> Comments (1:many)
  models.Project.hasMany(models.Comment, {
    foreignKey: 'project_id',
    as: 'comments',
    onDelete: 'CASCADE'
  });
  
  models.Comment.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // ReportingPeriod -> Comments (1:many)
  models.ReportingPeriod.hasMany(models.Comment, {
    foreignKey: 'period_id',
    as: 'comments',
    onDelete: 'CASCADE'
  });
  
  models.Comment.belongsTo(models.ReportingPeriod, {
    foreignKey: 'period_id',
    as: 'reportingPeriod'
  });

  // User associations (for assignment and tracking)
  // Projects can have assigned users
  models.Project.belongsTo(models.User, {
    foreignKey: 'assigned_user_id',
    as: 'assignedUser',
    allowNull: true
  });
  
  models.User.hasMany(models.Project, {
    foreignKey: 'assigned_user_id',
    as: 'assignedProjects'
  });

  // Next steps can be assigned to users
  models.NextStep.belongsTo(models.User, {
    foreignKey: 'assigned_user_id',
    as: 'assignedUser',
    allowNull: true
  });
  
  models.User.hasMany(models.NextStep, {
    foreignKey: 'assigned_user_id',
    as: 'assignedNextSteps'
  });

  // Comments have authors (users)
  models.Comment.belongsTo(models.User, {
    foreignKey: 'author_user_id',
    as: 'authorUser',
    allowNull: true
  });
  
  models.User.hasMany(models.Comment, {
    foreignKey: 'author_user_id',
    as: 'authoredComments'
  });

  logger.info('Model associations configured successfully');
};

// Helper function to get all model instances
const getAllModels = () => models;

// Model validation helper
const validateModels = async () => {
  const validationResults = {};
  
  for (const [modelName, Model] of Object.entries(models)) {
    try {
      // Test model connection by attempting to find one record
      await Model.findOne({ limit: 1 });
      validationResults[modelName] = { status: 'valid', error: null };
    } catch (error) {
      validationResults[modelName] = { status: 'error', error: error.message };
    }
  }
  
  return validationResults;
};

// Database health check that includes all models
const checkDatabaseHealth = async () => {
  try {
    const modelValidation = await validateModels();
    const hasErrors = Object.values(modelValidation).some(result => result.status === 'error');
    
    return {
      status: hasErrors ? 'degraded' : 'healthy',
      models: modelValidation,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Migration helper for transitioning from localStorage
const migrateFromLocalStorage = async (localStorageData) => {
  const sequelizeInstance = sequelize();
  const transaction = await sequelizeInstance.transaction();
  
  try {
    const migrationResults = {
      projects: 0,
      periods: 0,
      nextSteps: 0,
      errors: []
    };

    if (!localStorageData.projects || !Array.isArray(localStorageData.projects)) {
      throw new Error('Invalid localStorage data format');
    }

    // Migrate projects
    for (const projectData of localStorageData.projects) {
      try {
        // Create project
        const project = await models.Project.create({
          id: projectData.id,
          name: projectData.name,
          description: projectData.description || '',
          businessLead: projectData.businessLead || '',
          initiator: projectData.initiator || '',
          devTeamLead: projectData.devTeamLead || '',
          projectStartDate: projectData.projectStartDate || null,
          currentProjectStage: projectData.currentProjectStage || null,
          currentAiStage: projectData.currentAiStage || null,
          targetNextStageDate: projectData.targetNextStageDate || null,
          targetCompletionDate: projectData.targetCompletionDate || null,
          budget: projectData.budget || '',
          benefits: projectData.benefits || {
            fteSavings: { applicable: '', details: '' },
            costSavings: { applicable: '', details: '' },
            programIntegrity: { applicable: '', details: '' },
            clientService: { applicable: '', details: '' },
            other: { applicable: '', details: '' }
          },
          keyRisks: projectData.keyRisks || '',
          keyUpdates: projectData.keyUpdates || '',
          createdAt: projectData.createdAt || new Date(),
          updatedAt: projectData.updatedAt || new Date()
        }, { transaction });

        migrationResults.projects++;

      } catch (error) {
        migrationResults.errors.push({
          projectId: projectData.id,
          projectName: projectData.name,
          error: error.message
        });
        logger.error('Error migrating project:', {
          projectId: projectData.id,
          error: error.message
        });
      }
    }

    await transaction.commit();
    
    logger.info('Migration completed successfully', migrationResults);
    return migrationResults;
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Migration failed:', error);
    throw error;
  }
};

module.exports = {
  // Models (will be populated after initialization)
  get Project() { return models.Project; },
  get ReportingPeriod() { return models.ReportingPeriod; },
  get NextStep() { return models.NextStep; },
  get Comment() { return models.Comment; },
  get User() { return models.User; },
  get ProjectData() { return models.ProjectData; },
  
  // Functions
  initializeModels,
  getAllModels,
  validateModels,
  checkDatabaseHealth,
  migrateFromLocalStorage,
  
  // Database instance
  sequelize: sequelize()
};