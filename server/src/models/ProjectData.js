const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

const defineProjectDataModel = (sequelize) => {
  const ProjectData = sequelize.define('ProjectData', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique project data identifier'
    },
    projectId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id'
      },
      comment: 'Reference to the project'
    },
    periodId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'period_id',
      references: {
        model: 'reporting_periods',
        key: 'id'
      },
      comment: 'Reference to the reporting period'
    },
    fieldName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'field_name',
      validate: {
        notEmpty: true,
        isIn: [['benefits', 'key_risks', 'key_updates', 'description', 'business_lead', 
                'initiator', 'dev_team_lead', 'current_project_stage', 'current_ai_stage',
                'target_next_stage_date', 'target_completion_date', 'budget']]
      },
      comment: 'Field name (e.g., benefits, key_risks, key_updates)'
    },
    fieldValue: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'field_value',
      comment: 'Field value stored as JSON'
    },
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
    tableName: 'project_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['project_id', 'period_id', 'field_name'],
        name: 'idx_project_data'
      },
      {
        fields: ['period_id', 'project_id'],
        name: 'idx_project_data_lookup'
      },
      {
        unique: true,
        fields: ['project_id', 'period_id', 'field_name'],
        name: 'unique_project_field_period'
      }
    ],
    hooks: {
      beforeCreate: (projectData, options) => {
        if (!projectData.id) {
          projectData.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        logger.auditLog('CREATE', 'project_data', projectData.id, projectData.toJSON(), options.userId, options.req);
      },
      beforeUpdate: (projectData, options) => {
        const changes = projectData.changed() ? projectData.dataValues : {};
        logger.auditLog('UPDATE', 'project_data', projectData.id, changes, options.userId, options.req);
      },
      beforeDestroy: (projectData, options) => {
        logger.auditLog('DELETE', 'project_data', projectData.id, {
          projectId: projectData.projectId,
          periodId: projectData.periodId,
          fieldName: projectData.fieldName
        }, options.userId, options.req);
      }
    }
  });

  // Instance methods
  ProjectData.prototype.getDisplayValue = function() {
    if (this.fieldName === 'benefits' && typeof this.fieldValue === 'object') {
      return this.fieldValue;
    }
    
    if (typeof this.fieldValue === 'string' && this.fieldValue.startsWith('"') && this.fieldValue.endsWith('"')) {
      return JSON.parse(this.fieldValue);
    }
    
    return this.fieldValue;
  };

  // Static methods
  ProjectData.getProjectDataForPeriod = function(projectId, periodId) {
    return this.findAll({
      where: { projectId, periodId },
      order: [['field_name', 'ASC']]
    });
  };

  ProjectData.getFieldValueForPeriod = async function(projectId, periodId, fieldName) {
    const record = await this.findOne({
      where: { projectId, periodId, fieldName }
    });
    return record ? record.getDisplayValue() : null;
  };

  ProjectData.setFieldValueForPeriod = async function(projectId, periodId, fieldName, fieldValue) {
    const [record, created] = await this.findOrCreate({
      where: { projectId, periodId, fieldName },
      defaults: {
        fieldValue: typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
      }
    });

    if (!created) {
      record.fieldValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
      await record.save();
    }

    return record;
  };

  return ProjectData;
};

module.exports = defineProjectDataModel;