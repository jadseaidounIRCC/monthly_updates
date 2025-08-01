const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

const defineNextStepModel = (sequelize) => {
  const NextStep = sequelize.define('NextStep', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique next step identifier'
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Step description'
    },
    owner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Step owner name'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
      comment: 'Due date for the step'
    },
    status: {
      type: DataTypes.ENUM(
        'not-started',
        'in-progress',
        'ongoing',
        'blocked',
        'completed'
      ),
      allowNull: false,
      defaultValue: 'not-started',
      comment: 'Current status of the step'
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
      comment: 'Assigned user for this next step'
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
    tableName: 'next_steps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['project_id', 'period_id'],
        name: 'idx_project_steps'
      },
      {
        fields: ['due_date'],
        name: 'idx_due_date'
      },
      {
        fields: ['status'],
        name: 'idx_status'
      },
      {
        fields: ['owner'],
        name: 'idx_owner'
      }
    ],
    hooks: {
      beforeCreate: (step, options) => {
        if (!step.id) {
          step.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        logger.auditLog('CREATE', 'next_steps', step.id, step.toJSON(), options.userId, options.req);
      },
      beforeUpdate: (step, options) => {
        const changes = step.changed() ? step.dataValues : {};
        logger.auditLog('UPDATE', 'next_steps', step.id, changes, options.userId, options.req);
      },
      beforeDestroy: (step, options) => {
        logger.auditLog('DELETE', 'next_steps', step.id, {
          description: step.description,
          owner: step.owner
        }, options.userId, options.req);
      }
    }
  });

  // Instance methods
  NextStep.prototype.validate = function() {
    const errors = [];
    
    if (!this.description || this.description.trim().length === 0) {
      errors.push('Description is required');
    }
    
    if (!this.owner || this.owner.trim().length === 0) {
      errors.push('Owner is required');
    }
    
    const validStatuses = ['not-started', 'in-progress', 'ongoing', 'blocked', 'completed'];
    if (!this.status || !validStatuses.includes(this.status)) {
      errors.push('Valid status is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  NextStep.prototype.getStatusInfo = function() {
    const statusMap = {
      'not-started': { label: 'Not Started', class: 'not-started', priority: 1 },
      'in-progress': { label: 'In Progress', class: 'in-progress', priority: 2 },
      'ongoing': { label: 'Ongoing', class: 'ongoing', priority: 3 },
      'blocked': { label: 'Blocked', class: 'blocked', priority: 4 },
      'completed': { label: 'Completed', class: 'completed', priority: 5 }
    };
    
    return statusMap[this.status] || statusMap['not-started'];
  };

  NextStep.prototype.isOverdue = function() {
    if (!this.dueDate || this.status === 'completed') {
      return false;
    }
    
    const due = new Date(this.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return due < now;
  };

  NextStep.prototype.isDueSoon = function(daysAhead = 7) {
    if (!this.dueDate || this.status === 'completed') {
      return false;
    }
    
    const due = new Date(this.dueDate);
    const now = new Date();
    const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    return due >= now && due <= futureDate;
  };

  NextStep.prototype.markCompleted = async function(options = {}) {
    this.status = 'completed';
    await this.save(options);
    
    logger.info('Next step marked as completed', {
      stepId: this.id,
      projectId: this.projectId,
      description: this.description,
      owner: this.owner
    });
    
    return this;
  };

  // Static methods
  NextStep.findByProject = function(projectId, periodId = null) {
    const where = { projectId };
    if (periodId) {
      where.periodId = periodId;
    }
    
    return this.findAll({
      where,
      order: [['created_at', 'ASC']]
    });
  };

  NextStep.findOverdue = function(projectId = null) {
    const where = {
      dueDate: { [sequelize.Sequelize.Op.lt]: new Date() },
      status: { [sequelize.Sequelize.Op.ne]: 'completed' }
    };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    return this.findAll({
      where,
      order: [['due_date', 'ASC']]
    });
  };

  NextStep.findDueSoon = function(daysAhead = 7, projectId = null) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    const where = {
      dueDate: {
        [sequelize.Sequelize.Op.gte]: now,
        [sequelize.Sequelize.Op.lte]: futureDate
      },
      status: { [sequelize.Sequelize.Op.ne]: 'completed' }
    };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    return this.findAll({
      where,
      order: [['due_date', 'ASC']]
    });
  };

  NextStep.findByStatus = function(status, projectId = null, periodId = null) {
    const where = { status };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (periodId) {
      where.periodId = periodId;
    }
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  };

  NextStep.findByOwner = function(owner, projectId = null) {
    const where = { owner };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    return this.findAll({
      where,
      order: [['due_date', 'ASC'], ['created_at', 'ASC']]
    });
  };

  NextStep.getStatusSummary = async function(projectId = null, periodId = null) {
    const where = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (periodId) {
      where.periodId = periodId;
    }
    
    const steps = await this.findAll({ where });
    
    const summary = {
      total: steps.length,
      'not-started': 0,
      'in-progress': 0,
      'ongoing': 0,
      'blocked': 0,
      'completed': 0,
      overdue: 0,
      dueSoon: 0
    };
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    steps.forEach(step => {
      summary[step.status]++;
      
      if (step.dueDate && step.status !== 'completed') {
        const dueDate = new Date(step.dueDate);
        if (dueDate < now) {
          summary.overdue++;
        } else if (dueDate <= sevenDaysFromNow) {
          summary.dueSoon++;
        }
      }
    });
    
    return summary;
  };

  return NextStep;
};

module.exports = defineNextStepModel;