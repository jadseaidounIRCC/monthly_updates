const express = require('express');
const Joi = require('joi');
const { User } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const userValidation = {
  create: Joi.object({
    name: Joi.string().max(255).required(),
    email: Joi.string().email().max(255).required(),
    department: Joi.string().max(100).optional().allow(''),
    role: Joi.string().valid('admin', 'manager', 'contributor').default('contributor')
  }),
  
  update: Joi.object({
    name: Joi.string().max(255).optional(),
    email: Joi.string().email().max(255).optional(),
    department: Joi.string().max(100).optional().allow(''),
    role: Joi.string().valid('admin', 'manager', 'contributor').optional()
  }),
  
  bulkCreate: Joi.object({
    users: Joi.array().items(Joi.object({
      name: Joi.string().max(255).required(),
      email: Joi.string().email().max(255).required(),
      department: Joi.string().max(100).optional().allow(''),
      role: Joi.string().valid('admin', 'manager', 'contributor').default('contributor')
    })).min(1).max(100).required()
  })
};

// Request logging middleware
const logRequest = (req, res, next) => {
  logger.info(`Users API: ${req.method} ${req.originalUrl}`, {
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
};

router.use(logRequest);

// GET /api/users - Get all active users
router.get('/', async (req, res) => {
  try {
    const { 
      department, 
      role, 
      search, 
      includeInactive = 'false',
      page = 1, 
      limit = 50 
    } = req.query;

    let users;

    // Handle different query types
    if (search) {
      users = await User.search(search);
    } else if (department) {
      users = await User.findByDepartment(department);
    } else if (role) {
      users = await User.findByRole(role);
    } else if (includeInactive === 'true') {
      users = await User.findAll({
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });
    } else {
      users = await User.findActive();
    }

    res.json({
      success: true,
      data: users,
      meta: {
        count: users.length,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { department, role, search, includeInactive }
      }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/summary - Get user statistics
router.get('/summary', async (req, res) => {
  try {
    const { type = 'role' } = req.query;

    let summary;
    if (type === 'department') {
      summary = await User.getDepartmentSummary();
    } else {
      summary = await User.getRoleSummary();
    }

    res.json({
      success: true,
      data: summary,
      meta: {
        type,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching user summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/inactive - Get inactive users
router.get('/inactive', async (req, res) => {
  try {
    const users = await User.findInactive();

    res.json({
      success: true,
      data: users,
      meta: {
        count: users.length
      }
    });

  } catch (error) {
    logger.error('Error fetching inactive users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inactive users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/:userId - Get specific user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeAssignments = 'false' } = req.query;

    const include = [];
    if (includeAssignments === 'true') {
      include.push(
        {
          association: 'assignedProjects',
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'assignedNextSteps',
          attributes: ['id', 'description', 'status', 'dueDate']
        },
        {
          association: 'authoredComments',
          attributes: ['id', 'fieldReference', 'content', 'isResolved', 'createdAt']
        }
      );
    }

    const user = await User.findByPk(userId, { include });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      meta: {
        includeAssignments: includeAssignments === 'true'
      }
    });

  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { error, value } = userValidation.create.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: value.email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create(value, {
      userId: req.userId || 'system',
      req
    });

    logger.info('User created successfully', {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/users/bulk - Create multiple users
router.post('/bulk', async (req, res) => {
  try {
    const { error, value } = userValidation.bulkCreate.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const results = await User.createBulk(value.users, {
      userId: req.userId || 'system',
      req
    });

    res.status(201).json({
      success: true,
      data: results,
      message: `Bulk user creation completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      meta: {
        successCount: results.successful.length,
        failureCount: results.failed.length,
        totalAttempted: value.users.length
      }
    });

  } catch (error) {
    logger.error('Error creating users in bulk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create users in bulk',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/users/:userId - Update user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = userValidation.update.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check email uniqueness if email is being updated
    if (value.email && value.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email: value.email.toLowerCase(),
          id: { [User.sequelize.Sequelize.Op.ne]: userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    await user.update(value, {
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/users/:userId/deactivate - Deactivate user
router.post('/:userId/deactivate', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already inactive'
      });
    }

    await user.deactivate({
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/users/:userId/activate - Activate user
router.post('/:userId/activate', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    await user.activate({
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      data: user,
      message: 'User activated successfully'
    });

  } catch (error) {
    logger.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/users/:userId - Delete user (soft delete via deactivation)
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = 'false' } = req.query;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (permanent === 'true') {
      // Hard delete (use with caution)
      await user.destroy({
        userId: req.userId || 'system',
        req
      });

      res.json({
        success: true,
        message: 'User permanently deleted'
      });
    } else {
      // Soft delete via deactivation
      await user.deactivate({
        userId: req.userId || 'system',
        req
      });

      res.json({
        success: true,
        data: user,
        message: 'User deactivated (soft delete)'
      });
    }

  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Users API error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;