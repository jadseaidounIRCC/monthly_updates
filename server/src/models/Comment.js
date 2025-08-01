const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

const defineCommentModel = (sequelize) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique comment identifier'
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
    fieldReference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'field_reference',
      comment: 'Field reference (e.g., description, benefits.fteSavings, nextSteps.{stepId})'
    },
    parentCommentId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'parent_comment_id',
      references: {
        model: 'comments',
        key: 'id'
      },
      comment: 'Parent comment ID for threaded comments'
    },
    authorName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'author_name',
      validate: {
        notEmpty: true
      },
      comment: 'Comment author name'
    },
    // User reference for author
    authorUserId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'author_user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to user who authored this comment'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Comment content'
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_resolved',
      comment: 'Whether the comment thread is resolved'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
      comment: 'Timestamp when comment was resolved'
    },
    resolvedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'resolved_by',
      comment: 'Name of person who resolved the comment'
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
    tableName: 'comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['project_id', 'period_id', 'field_reference'],
        name: 'idx_field_comments'
      },
      {
        fields: ['parent_comment_id'],
        name: 'idx_comment_thread'
      },
      {
        fields: ['author_name'],
        name: 'idx_author'
      },
      {
        fields: ['is_resolved'],
        name: 'idx_resolved_status'
      },
      {
        fields: ['created_at'],
        name: 'idx_created_date'
      }
    ],
    hooks: {
      beforeCreate: (comment, options) => {
        if (!comment.id) {
          comment.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        logger.auditLog('CREATE', 'comments', comment.id, comment.toJSON(), options.userId, options.req);
      },
      beforeUpdate: (comment, options) => {
        const changes = comment.changed() ? comment.dataValues : {};
        logger.auditLog('UPDATE', 'comments', comment.id, changes, options.userId, options.req);
      },
      beforeDestroy: (comment, options) => {
        logger.auditLog('DELETE', 'comments', comment.id, {
          fieldReference: comment.fieldReference,
          authorName: comment.authorName,
          content: comment.content.substring(0, 100) + '...'
        }, options.userId, options.req);
      }
    }
  });

  // Define self-referencing association for threaded comments
  Comment.belongsTo(Comment, {
    as: 'parentComment',
    foreignKey: 'parent_comment_id'
  });

  Comment.hasMany(Comment, {
    as: 'replies',
    foreignKey: 'parent_comment_id'
  });

  // Instance methods
  Comment.prototype.validate = function() {
    const errors = [];
    
    if (!this.authorName || this.authorName.trim().length === 0) {
      errors.push('Author name is required');
    }
    
    if (!this.content || this.content.trim().length === 0) {
      errors.push('Comment content is required');
    }
    
    if (!this.fieldReference || this.fieldReference.trim().length === 0) {
      errors.push('Field reference is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  Comment.prototype.isReply = function() {
    return this.parentCommentId !== null;
  };

  Comment.prototype.isTopLevel = function() {
    return this.parentCommentId === null;
  };

  Comment.prototype.markResolved = async function(resolvedBy, options = {}) {
    this.isResolved = true;
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
    
    await this.save(options);
    
    logger.info('Comment marked as resolved', {
      commentId: this.id,
      projectId: this.projectId,
      fieldReference: this.fieldReference,
      resolvedBy: resolvedBy
    });
    
    return this;
  };

  Comment.prototype.markUnresolved = async function(options = {}) {
    this.isResolved = false;
    this.resolvedAt = null;
    this.resolvedBy = null;
    
    await this.save(options);
    
    logger.info('Comment marked as unresolved', {
      commentId: this.id,
      projectId: this.projectId,
      fieldReference: this.fieldReference
    });
    
    return this;
  };

  // Static methods
  Comment.findByField = function(projectId, periodId, fieldReference, includeReplies = true) {
    const options = {
      where: {
        projectId,
        periodId,
        fieldReference,
        parentCommentId: null // Only top-level comments
      },
      order: [['created_at', 'ASC']]
    };
    
    if (includeReplies) {
      options.include = [{
        model: Comment,
        as: 'replies',
        order: [['created_at', 'ASC']]
      }];
    }
    
    return this.findAll(options);
  };

  Comment.findByProject = function(projectId, periodId = null) {
    const where = { projectId };
    
    if (periodId) {
      where.periodId = periodId;
    }
    
    return this.findAll({
      where,
      include: [{
        model: Comment,
        as: 'replies',
        order: [['created_at', 'ASC']]
      }],
      order: [['created_at', 'DESC']]
    });
  };

  Comment.findUnresolved = function(projectId = null, periodId = null) {
    const where = {
      isResolved: false,
      parentCommentId: null // Only top-level comments
    };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (periodId) {
      where.periodId = periodId;
    }
    
    return this.findAll({
      where,
      include: [{
        model: Comment,
        as: 'replies',
        order: [['created_at', 'ASC']]
      }],
      order: [['created_at', 'ASC']]
    });
  };

  Comment.findByAuthor = function(authorName, projectId = null) {
    const where = { authorName };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  };

  Comment.getFieldSummary = async function(projectId, periodId) {
    const comments = await this.findAll({
      where: { projectId, periodId },
      attributes: ['fieldReference', 'isResolved']
    });
    
    const summary = {};
    
    comments.forEach(comment => {
      const field = comment.fieldReference;
      
      if (!summary[field]) {
        summary[field] = {
          total: 0,
          resolved: 0,
          unresolved: 0
        };
      }
      
      summary[field].total++;
      
      if (comment.isResolved) {
        summary[field].resolved++;
      } else {
        summary[field].unresolved++;
      }
    });
    
    return summary;
  };

  Comment.createWithThread = async function(commentData, options = {}) {
    const { replies = [], ...mainCommentData } = commentData;
    
    // Create main comment
    const mainComment = await this.create(mainCommentData, options);
    
    // Create replies if provided
    const createdReplies = [];
    for (const replyData of replies) {
      const reply = await this.create({
        ...replyData,
        parentCommentId: mainComment.id,
        projectId: mainComment.projectId,
        periodId: mainComment.periodId,
        fieldReference: mainComment.fieldReference
      }, options);
      
      createdReplies.push(reply);
    }
    
    // Return main comment with replies
    return {
      ...mainComment.toJSON(),
      replies: createdReplies.map(reply => reply.toJSON())
    };
  };

  Comment.deleteThread = async function(commentId, options = {}) {
    const comment = await this.findByPk(commentId, {
      include: [{ model: Comment, as: 'replies' }]
    });
    
    if (!comment) {
      throw new Error('Comment not found');
    }
    
    // Delete all replies first
    if (comment.replies && comment.replies.length > 0) {
      await this.destroy({
        where: { parentCommentId: commentId },
        ...options
      });
    }
    
    // Delete main comment
    await comment.destroy(options);
    
    logger.info('Comment thread deleted', {
      commentId,
      projectId: comment.projectId,
      fieldReference: comment.fieldReference,
      repliesCount: comment.replies ? comment.replies.length : 0
    });
    
    return true;
  };

  return Comment;
};

module.exports = defineCommentModel;