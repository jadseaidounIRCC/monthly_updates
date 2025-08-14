const express = require('express');
const Joi = require('joi');
const { Comment, Project, ReportingPeriod } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// Validation schemas
const commentValidation = {
  create: Joi.object({
    projectId: Joi.string().min(1).max(50).required(), // Allow flexible ID format
    periodId: Joi.string().min(1).max(50).required(), // Allow flexible ID format
    fieldReference: Joi.string().max(100).required(),
    parentCommentId: Joi.string().min(1).max(50).optional().allow(null), // Allow flexible ID format
    authorName: Joi.string().max(255).required(),
    content: Joi.string().required(),
    isResolved: Joi.boolean().optional(), // Allow this field from frontend
    replies: Joi.array().items(Joi.object({
      authorName: Joi.string().max(255).required(),
      content: Joi.string().required()
    })).optional()
  }),
  
  update: Joi.object({
    content: Joi.string().optional(),
    isResolved: Joi.boolean().optional(),
    resolvedBy: Joi.string().max(255).when('isResolved', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(null)
    })
  }),
  
  reply: Joi.object({
    authorName: Joi.string().max(255).required(),
    content: Joi.string().required()
  })
};

// Request logging middleware
const logRequest = (req, res, next) => {
  logger.info(`Comments API: ${req.method} ${req.originalUrl}`, {
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
};

router.use(logRequest);

// GET /api/comments/field/:projectId/:periodId/:fieldReference - Get comments for a specific field
router.get('/field/:projectId/:periodId/:fieldReference', async (req, res) => {
  try {
    const { projectId, periodId, fieldReference } = req.params;
    const { includeReplies = 'true' } = req.query;

    // Validate project and period exist
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    const comments = await Comment.findByField(
      projectId,
      periodId,
      decodeURIComponent(fieldReference),
      includeReplies === 'true'
    );

    res.json({
      success: true,
      data: comments,
      meta: {
        count: comments.length,
        projectId,
        periodId,
        fieldReference: decodeURIComponent(fieldReference)
      }
    });

  } catch (error) {
    logger.error('Error fetching field comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/comments/project/:projectId - Get all comments for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { periodId, page = 1, limit = 50 } = req.query;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const comments = await Comment.findByProject(projectId, periodId);

    res.json({
      success: true,
      data: comments,
      meta: {
        count: comments.length,
        projectId,
        periodId: periodId || 'all'
      }
    });

  } catch (error) {
    logger.error('Error fetching project comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/comments/unresolved - Get all unresolved comments
router.get('/unresolved', async (req, res) => {
  try {
    const { projectId, periodId } = req.query;

    const comments = await Comment.findUnresolved(projectId, periodId);

    res.json({
      success: true,
      data: comments,
      meta: {
        count: comments.length,
        projectId: projectId || 'all',
        periodId: periodId || 'all'
      }
    });

  } catch (error) {
    logger.error('Error fetching unresolved comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unresolved comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/comments/summary/:projectId/:periodId - Get field comment summary
router.get('/summary/:projectId/:periodId', async (req, res) => {
  try {
    const { projectId, periodId } = req.params;

    // Validate project and period exist
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const period = await ReportingPeriod.findByPk(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    const summary = await Comment.getFieldSummary(projectId, periodId);

    res.json({
      success: true,
      data: summary,
      meta: {
        projectId,
        periodId,
        totalFields: Object.keys(summary).length
      }
    });

  } catch (error) {
    logger.error('Error fetching comment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/comments - Create a new comment (with optional replies)
router.post('/', async (req, res) => {
  try {
    const { error, value } = commentValidation.create.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Validate project and period exist
    const project = await Project.findByPk(value.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const period = await ReportingPeriod.findByPk(value.periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Reporting period not found'
      });
    }

    // Check if period is locked (prevent new comments in locked periods)
    if (period.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add comments to locked reporting period'
      });
    }

    // If parentCommentId provided, validate it exists
    if (value.parentCommentId) {
      const parentComment = await Comment.findByPk(value.parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
      
      // Ensure parent comment is in same project/period/field
      if (parentComment.projectId !== value.projectId || 
          parentComment.periodId !== value.periodId || 
          parentComment.fieldReference !== value.fieldReference) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment must be in same project, period, and field'
        });
      }
    }

    const comment = await Comment.createWithThread(value, {
      userId: req.userId || 'system',
      req
    });

    logger.info('Comment created successfully', {
      commentId: comment.id,
      projectId: value.projectId,
      fieldReference: value.fieldReference,
      authorName: value.authorName,
      hasReplies: value.replies && value.replies.length > 0
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully'
    });

  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/comments/:commentId/reply - Add a reply to existing comment
router.post('/:commentId/reply', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { error, value } = commentValidation.reply.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found'
      });
    }

    // Check if period is locked
    const period = await ReportingPeriod.findByPk(parentComment.periodId);
    if (period && period.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add replies to comments in locked reporting period'
      });
    }

    const reply = await Comment.create({
      ...value,
      parentCommentId: commentId,
      projectId: parentComment.projectId,
      periodId: parentComment.periodId,
      fieldReference: parentComment.fieldReference
    }, {
      userId: req.userId || 'system',
      req
    });

    res.status(201).json({
      success: true,
      data: reply,
      message: 'Reply added successfully'
    });

  } catch (error) {
    logger.error('Error creating reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reply',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/comments/:commentId - Update a comment
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { error, value } = commentValidation.update.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if period is locked
    const period = await ReportingPeriod.findByPk(comment.periodId);
    if (period && period.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify comments in locked reporting period'
      });
    }

    // Handle resolution status change
    if (value.hasOwnProperty('isResolved')) {
      if (value.isResolved && !comment.isResolved) {
        await comment.markResolved(value.resolvedBy, {
          userId: req.userId || 'system',
          req
        });
      } else if (!value.isResolved && comment.isResolved) {
        await comment.markUnresolved({
          userId: req.userId || 'system',
          req
        });
      }
    }

    // Update other fields
    if (value.content) {
      comment.content = value.content;
      await comment.save({
        userId: req.userId || 'system',
        req
      });
    }

    res.json({
      success: true,
      data: comment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    logger.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/comments/:commentId - Delete a comment thread
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if period is locked
    const period = await ReportingPeriod.findByPk(comment.periodId);
    if (period && period.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete comments in locked reporting period'
      });
    }

    await Comment.deleteThread(commentId, {
      userId: req.userId || 'system',
      req
    });

    res.json({
      success: true,
      message: 'Comment thread deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Comments API error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;