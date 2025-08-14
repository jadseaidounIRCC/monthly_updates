import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import ApiService from '../services/ApiService';

interface CommentIconProps {
  fieldRef: string;
  projectId: string;
  periodId: string;
  displayName?: string;
}

const CommentIcon: React.FC<CommentIconProps> = ({
  fieldRef,
  projectId,
  periodId,
  displayName
}) => {
  const [commentCount, setCommentCount] = useState(0);
  const [hasUnresolved, setHasUnresolved] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCommentInfo = useCallback(async () => {
    // Don't load if we don't have required IDs
    if (!projectId || !periodId || !fieldRef) {
      setCommentCount(0);
      setHasUnresolved(false);
      return;
    }
    
    try {
      setLoading(true);
      const comments = await ApiService.getComments(projectId, periodId, fieldRef);
      setCommentCount(comments.length);
      setHasUnresolved(comments.some((comment: any) => !comment.isResolved));
    } catch (error) {
      console.error('Error loading comment info:', error);
      setCommentCount(0);
      setHasUnresolved(false);
    } finally {
      setLoading(false);
    }
  }, [fieldRef, projectId, periodId]);

  useEffect(() => {
    loadCommentInfo();
  }, [loadCommentInfo]);

  const handleClick = () => {
    const fieldDisplayName = displayName || formatFieldName(fieldRef);
    
    // Use the global function attached to window
    if ((window as any).openCommentModal) {
      (window as any).openCommentModal(fieldRef, fieldDisplayName, projectId, periodId);
      // Refresh comment count after modal closes
      setTimeout(() => loadCommentInfo(), 500);
    } else {
      console.warn('Comment modal function not available yet');
    }
  };

  const formatFieldName = (fieldRef: string): string => {
    // Convert camelCase and dot notation to readable names
    const parts = fieldRef.split('.');
    const lastPart = parts[parts.length - 1];
    
    return lastPart
      .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  if (loading) {
    return (
      <div className="comment-icon-wrapper">
        <div className="comment-icon loading">
          <MessageCircle size={14} />
        </div>
      </div>
    );
  }

  return (
    <div className="comment-icon-wrapper">
      <button
        className={`comment-icon ${commentCount > 0 ? 'has-comments' : ''} ${hasUnresolved ? 'has-unresolved' : ''}`}
        onClick={handleClick}
        title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}${hasUnresolved ? ' (unresolved)' : ''}`}
      >
        <MessageCircle size={14} />
        {commentCount > 0 && (
          <span className="comment-count">{commentCount}</span>
        )}
        {hasUnresolved && <div className="unresolved-indicator" />}
      </button>
    </div>
  );
};

export default CommentIcon;