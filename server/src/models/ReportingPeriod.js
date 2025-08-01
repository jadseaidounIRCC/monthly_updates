const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

const defineReportingPeriodModel = (sequelize) => {
  const ReportingPeriod = sequelize.define('ReportingPeriod', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique reporting period identifier'
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
    periodStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'period_start',
      comment: 'Period start date (15th of month)'
    },
    periodEnd: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'period_end',
      comment: 'Period end date (15th of next month)'
    },
    periodName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'period_name',
      comment: 'Period name (e.g., "August 2024")'
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_locked',
      comment: 'Whether this period is locked (immutable)'
    },
    dataSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'data_snapshot',
      comment: 'Immutable snapshot of project data when period was locked'
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'locked_at',
      comment: 'Timestamp when period was locked'
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
    tableName: 'reporting_periods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['project_id', 'period_start'],
        name: 'idx_project_period'
      },
      {
        fields: ['period_start', 'period_end'],
        name: 'idx_period_dates'
      },
      {
        fields: ['is_locked'],
        name: 'idx_locked_status'
      },
      {
        unique: true,
        fields: ['project_id', 'period_start', 'period_end'],
        name: 'unique_project_period'
      }
    ],
    hooks: {
      beforeCreate: (period, options) => {
        if (!period.id) {
          period.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        logger.auditLog('CREATE', 'reporting_periods', period.id, period.toJSON(), options.userId, options.req);
      },
      beforeUpdate: (period, options) => {
        // Prevent updates to locked periods
        if (period.isLocked && period.changed() && !options.force) {
          throw new Error('Cannot modify locked reporting period');
        }
        
        const changes = period.changed() ? period.dataValues : {};
        logger.auditLog('UPDATE', 'reporting_periods', period.id, changes, options.userId, options.req);
      },
      beforeDestroy: (period, options) => {
        // Prevent deletion of locked periods
        if (period.isLocked && !options.force) {
          throw new Error('Cannot delete locked reporting period');
        }
        
        logger.auditLog('DELETE', 'reporting_periods', period.id, {
          projectId: period.projectId,
          periodName: period.periodName
        }, options.userId, options.req);
      }
    }
  });

  // Instance methods
  ReportingPeriod.prototype.lock = async function(projectData, options = {}) {
    if (this.isLocked) {
      throw new Error('Reporting period is already locked');
    }

    this.isLocked = true;
    this.lockedAt = new Date();
    this.dataSnapshot = projectData;

    await this.save({ ...options, force: true });
    
    logger.info('Reporting period locked', {
      periodId: this.id,
      projectId: this.projectId,
      periodName: this.periodName,
      lockedAt: this.lockedAt
    });

    return this;
  };

  ReportingPeriod.prototype.isCurrentPeriod = function() {
    const now = new Date();
    const startDate = new Date(this.periodStart);
    const endDate = new Date(this.periodEnd);
    
    return now >= startDate && now < endDate;
  };

  ReportingPeriod.prototype.shouldBeLocked = function() {
    const now = new Date();
    const endDate = new Date(this.periodEnd);
    
    // Period should be locked if we've passed the end date
    return now >= endDate && !this.isLocked;
  };

  // Static methods
  ReportingPeriod.findCurrentPeriod = function(projectId) {
    const now = new Date();
    return this.findOne({
      where: {
        projectId,
        periodStart: { [sequelize.Sequelize.Op.lte]: now },
        periodEnd: { [sequelize.Sequelize.Op.gt]: now }
      }
    });
  };

  ReportingPeriod.findByProject = function(projectId, options = {}) {
    return this.findAll({
      where: { projectId },
      order: [['period_start', 'DESC']],
      ...options
    });
  };

  ReportingPeriod.findPendingLocks = function() {
    const now = new Date();
    return this.findAll({
      where: {
        isLocked: false,
        periodEnd: { [sequelize.Sequelize.Op.lte]: now }
      }
    });
  };

  ReportingPeriod.calculatePeriodForDate = function(date = new Date()) {
    const currentDate = new Date(date);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();

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
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      periodName: `${monthNames[endMonth]} ${endYear}`
    };
  };

  ReportingPeriod.createForProject = async function(projectId, periodData = null, options = {}) {
    const period = periodData || this.calculatePeriodForDate();
    
    // Check if period already exists
    const existing = await this.findOne({
      where: {
        projectId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd
      }
    });

    if (existing) {
      return existing;
    }

    return this.create({
      projectId,
      ...period
    }, options);
  };

  return ReportingPeriod;
};

module.exports = defineReportingPeriodModel;