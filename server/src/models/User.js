const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

const defineUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique user identifier'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'User full name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      },
      comment: 'User email address'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'User department or team'
    },
    role: {
      type: DataTypes.ENUM(
        'admin',
        'manager', 
        'contributor'
      ),
      allowNull: false,
      defaultValue: 'contributor',
      comment: 'User role for access control'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether user is active in the system'
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'unique_email'
      },
      {
        fields: ['department'],
        name: 'idx_department'
      },
      {
        fields: ['role'],
        name: 'idx_role'
      },
      {
        fields: ['is_active'],
        name: 'idx_active_status'
      },
      {
        fields: ['name'],
        name: 'idx_name'
      }
    ],
    hooks: {
      beforeCreate: (user, options) => {
        if (!user.id) {
          user.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        // Normalize email to lowercase
        user.email = user.email.toLowerCase();
        
        logger.auditLog('CREATE', 'users', user.id, user.toJSON(), options.userId, options.req);
      },
      beforeUpdate: (user, options) => {
        // Normalize email to lowercase
        if (user.changed('email')) {
          user.email = user.email.toLowerCase();
        }
        
        const changes = user.changed() ? user.dataValues : {};
        logger.auditLog('UPDATE', 'users', user.id, changes, options.userId, options.req);
      },
      beforeDestroy: (user, options) => {
        logger.auditLog('DELETE', 'users', user.id, {
          name: user.name,
          email: user.email,
          department: user.department
        }, options.userId, options.req);
      }
    }
  });

  // Instance methods
  User.prototype.validate = function() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email is required');
    }
    
    const validRoles = ['admin', 'manager', 'contributor'];
    if (!this.role || !validRoles.includes(this.role)) {
      errors.push('Valid role is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  User.prototype.getRoleInfo = function() {
    const roleMap = {
      'admin': { 
        label: 'Administrator', 
        permissions: ['create', 'read', 'update', 'delete', 'manage_users', 'lock_periods'],
        priority: 3 
      },
      'manager': { 
        label: 'Manager', 
        permissions: ['create', 'read', 'update', 'delete', 'assign_tasks'],
        priority: 2 
      },
      'contributor': { 
        label: 'Contributor', 
        permissions: ['create', 'read', 'update'],
        priority: 1 
      }
    };
    
    return roleMap[this.role] || roleMap['contributor'];
  };

  User.prototype.canPerform = function(action) {
    const roleInfo = this.getRoleInfo();
    return roleInfo.permissions.includes(action);
  };

  User.prototype.getDisplayName = function() {
    return this.name || this.email.split('@')[0];
  };

  User.prototype.deactivate = async function(options = {}) {
    this.isActive = false;
    await this.save(options);
    
    logger.info('User deactivated', {
      userId: this.id,
      name: this.name,
      email: this.email
    });
    
    return this;
  };

  User.prototype.activate = async function(options = {}) {
    this.isActive = true;
    await this.save(options);
    
    logger.info('User activated', {
      userId: this.id,
      name: this.name,
      email: this.email
    });
    
    return this;
  };

  // Static methods
  User.findByEmail = function(email) {
    return this.findOne({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    });
  };

  User.findByDepartment = function(department) {
    return this.findAll({
      where: { 
        department,
        isActive: true 
      },
      order: [['name', 'ASC']]
    });
  };

  User.findByRole = function(role) {
    return this.findAll({
      where: { 
        role,
        isActive: true 
      },
      order: [['name', 'ASC']]
    });
  };

  User.findActive = function() {
    return this.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
  };

  User.findInactive = function() {
    return this.findAll({
      where: { isActive: false },
      order: [['name', 'ASC']]
    });
  };

  User.search = function(searchTerm) {
    const { Op } = sequelize.Sequelize;
    
    return this.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } },
          { department: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });
  };

  User.getDepartmentSummary = async function() {
    const users = await this.findAll({
      where: { isActive: true },
      attributes: ['department', 'role']
    });
    
    const summary = {};
    
    users.forEach(user => {
      const dept = user.department || 'No Department';
      
      if (!summary[dept]) {
        summary[dept] = {
          total: 0,
          admin: 0,
          manager: 0,
          contributor: 0
        };
      }
      
      summary[dept].total++;
      summary[dept][user.role]++;
    });
    
    return summary;
  };

  User.getRoleSummary = async function() {
    const users = await this.findAll({
      where: { isActive: true },
      attributes: ['role']
    });
    
    const summary = {
      total: users.length,
      admin: 0,
      manager: 0,
      contributor: 0
    };
    
    users.forEach(user => {
      summary[user.role]++;
    });
    
    return summary;
  };

  User.createBulk = async function(usersData, options = {}) {
    const results = {
      successful: [],
      failed: []
    };

    for (const userData of usersData) {
      try {
        const user = await this.create(userData, options);
        results.successful.push({
          id: user.id,
          name: user.name,
          email: user.email
        });
      } catch (error) {
        results.failed.push({
          userData,
          error: error.message
        });
        
        logger.error('Failed to create user in bulk:', {
          userData,
          error: error.message
        });
      }
    }

    return results;
  };

  return User;
};

module.exports = defineUserModel;