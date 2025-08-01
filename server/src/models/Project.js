const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

const defineProjectModel = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique project identifier'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'Project name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Project description'
    },
    businessLead: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'business_lead',
      comment: 'Business lead name'
    },
    initiator: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Project initiator name'
    },
    devTeamLead: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'dev_team_lead',
      comment: 'Development team lead name'
    },
    projectStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'project_start_date',
      comment: 'Project start date'
    },
    currentProjectStage: {
      type: DataTypes.ENUM('prototype', 'poc', 'pilot'),
      allowNull: true,
      field: 'current_project_stage',
      comment: 'Current project development stage'
    },
    currentAiStage: {
      type: DataTypes.ENUM(
        'planning-design',
        'data-collection',
        'model-building',
        'testing-validation',
        'deployment',
        'monitoring'
      ),
      allowNull: true,
      field: 'current_ai_stage',
      comment: 'Current AI lifecycle stage'
    },
    targetNextStageDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'target_next_stage_date',
      comment: 'Target date for next AI lifecycle stage'
    },
    targetCompletionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'target_completion_date',
      comment: 'Target project completion date'
    },
    budget: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Project budget or TBD'
    },
    // Expected benefits stored as JSON
    benefits: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        fteSavings: { applicable: '', details: '' },
        costSavings: { applicable: '', details: '' },
        programIntegrity: { applicable: '', details: '' },
        clientService: { applicable: '', details: '' },
        other: { applicable: '', details: '' }
      },
      comment: 'Expected benefits configuration'
    },
    // Content sections
    keyRisks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'key_risks',
      comment: 'Key risks and issues'
    },
    keyUpdates: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'key_updates',
      comment: 'Key project updates'
    },
    // User assignment
    assignedUserId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'assigned_user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Assigned user for this project'
    },
    // Audit fields
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['current_project_stage']
      },
      {
        fields: ['current_ai_stage']
      }
    ],
    hooks: {
      beforeCreate: (project, options) => {
        if (!project.id) {
          project.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        logger.auditLog('CREATE', 'projects', project.id, project.toJSON(), options.userId, options.req);
      },
      beforeUpdate: (project, options) => {
        const changes = project.changed() ? project.dataValues : {};
        logger.auditLog('UPDATE', 'projects', project.id, changes, options.userId, options.req);
      },
      beforeDestroy: (project, options) => {
        logger.auditLog('DELETE', 'projects', project.id, { name: project.name }, options.userId, options.req);
      }
    }
  });

  // Instance methods
  Project.prototype.getReportingPeriod = function() {
    // Calculate current reporting period (15th to 15th)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    let startMonth, startYear, endMonth, endYear;

    if (currentDay >= 15) {
      startMonth = currentMonth;
      startYear = currentYear;
      endMonth = currentMonth + 1;
      endYear = currentYear;

      if (endMonth > 11) {
        endMonth = 0;
        endYear++;
      }
    } else {
      startMonth = currentMonth - 1;
      startYear = currentYear;
      endMonth = currentMonth;
      endYear = currentYear;

      if (startMonth < 0) {
        startMonth = 11;
        startYear--;
      }
    }

    const startDate = new Date(startYear, startMonth, 15);
    const endDate = new Date(endYear, endMonth, 15);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      startDate,
      endDate,
      periodName: `${monthNames[endMonth]} ${endYear}`,
      periodString: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`
    };
  };

  Project.prototype.validate = function() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Project name is required');
    }
    
    if (this.name && this.name.length > 255) {
      errors.push('Project name must be less than 255 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Static methods
  Project.findByName = function(name) {
    return this.findOne({ where: { name } });
  };

  Project.findActive = function() {
    return this.findAll({
      order: [['updated_at', 'DESC']]
    });
  };

  return Project;
};

module.exports = defineProjectModel;