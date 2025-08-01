import React, { useState } from 'react';
import { X, Reply, Check, XCircle, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { CommentModalProps, Comment } from '../types';

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  fieldRef,
  fieldDisplayName,
  projectId,
  periodId,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveComment,
  onAddReply
}) => {
  const [newComment, setNewComment] = useState({ authorName: '', content: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState({ authorName: '', content: '' });
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.authorName.trim() || !newComment.content.trim()) return;

    try {
      setLoading(true);
      await onAddComment({
        projectId,
        periodId,
        fieldReference: fieldRef,
        authorName: newComment.authorName,
        content: newComment.content,
        isResolved: false
      });
      setNewComment({ authorName: '', content: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.authorName.trim() || !replyContent.content.trim()) return;

    try {
      setLoading(true);
      await onAddReply(parentId, {
        projectId,
        periodId,
        fieldReference: fieldRef,
        authorName: replyContent.authorName,
        content: replyContent.content,
        isResolved: false
      });
      setReplyContent({ authorName: '', content: '' });
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setLoading(true);
      await onEditComment(commentId, { content: editContent });
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      setLoading(true);
      await onDeleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      setLoading(true);
      await onResolveComment(commentId, resolved);
    } catch (error) {
      console.error('Error resolving comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div 
      key={comment.id}
      className={`comment ${isReply ? 'comment-reply' : 'comment-main'} ${comment.isResolved ? 'comment-resolved' : ''}`}
    >
      <div className="comment-header">
        <div className="comment-author">
          <strong>{comment.authorName}</strong>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
          {comment.isResolved && <span className="resolved-badge">Resolved</span>}
        </div>
        <div className="comment-actions">
          {!isReply && (
            <>
              <button
                className="btn-icon reply-btn"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                title="Reply"
              >
                <Reply size={16} />
              </button>
              <button
                className="btn-icon resolve-btn"
                onClick={() => handleResolve(comment.id, !comment.isResolved)}
                title={comment.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
              >
                {comment.isResolved ? <XCircle size={16} /> : <Check size={16} />}
              </button>
            </>
          )}
          <button
            className="btn-icon edit-btn"
            onClick={() => {
              setEditingComment(editingComment === comment.id ? null : comment.id);
              setEditContent(comment.content);
            }}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn-icon delete-btn"
            onClick={() => handleDelete(comment.id)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="comment-content">
        {editingComment === comment.id ? (
          <div className="edit-comment-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="form-control"
            />
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleEdit(comment.id)}
                disabled={loading}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-text">
            {comment.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < comment.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="reply-form-container">
          <form onSubmit={(e) => { e.preventDefault(); handleReply(comment.id); }}>
            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={replyContent.authorName}
                onChange={(e) => setReplyContent(prev => ({ ...prev, authorName: e.target.value }))}
                required
                placeholder="Enter your name"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Reply:</label>
              <textarea
                value={replyContent.content}
                onChange={(e) => setReplyContent(prev => ({ ...prev, content: e.target.value }))}
                required
                placeholder="Enter your reply..."
                rows={2}
                className="form-control"
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent({ authorName: '', content: '' });
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                Add Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content comment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <MessageCircle size={20} />
            Comments: {fieldDisplayName}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body comment-modal-body">
          <div className="comment-thread">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>No comments yet. Be the first to add one!</p>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
          
          <div className="add-comment-section">
            <h4>Add New Comment</h4>
            <form onSubmit={handleAddComment}>
              <div className="form-group">
                <label htmlFor="comment-author">Your Name:</label>
                <input
                  id="comment-author"
                  type="text"
                  value={newComment.authorName}
                  onChange={(e) => setNewComment(prev => ({ ...prev, authorName: e.target.value }))}
                  required
                  placeholder="Enter your name"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="comment-content">Comment:</label>
                <textarea
                  id="comment-content"
                  value={newComment.content}
                  onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                  required
                  placeholder="Enter your comment..."
                  rows={3}
                  className="form-control"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Add Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;