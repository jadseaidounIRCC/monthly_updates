import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.toLowerCase() !== 'confirm') return;

    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText.toLowerCase() === 'confirm';

  return (
    <div className="modal show">
      <div className="modal-content" style={{ 
        maxWidth: '500px'
      }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h3>Delete Project</h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              You are about to permanently delete the project:
            </p>
            
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'var(--background-tertiary)', 
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{projectName}</strong>
            </div>
            
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              This action <strong style={{ color: 'var(--text-primary)' }}>cannot be undone</strong>. All data associated with this project will be permanently deleted.
            </p>
            
            <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.95rem' }}>
              To confirm, type <code style={{ 
                backgroundColor: 'var(--background-secondary)', 
                padding: '2px 6px', 
                borderRadius: '3px',
                fontSize: '0.9em',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}>confirm</code> below:
            </p>
          </div>
          
          <div className="form-group">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'confirm' to delete"
              autoFocus
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: '500',
                border: `2px solid ${!isConfirmValid && confirmText ? '#ef4444' : 'var(--border-color)'}`,
                borderRadius: '6px',
                backgroundColor: 'var(--background-tertiary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            {confirmText && !isConfirmValid && (
              <p style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem', 
                marginTop: '4px',
                marginBottom: '0' 
              }}>
                Please type "confirm" exactly as shown
              </p>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-danger"
              disabled={!isConfirmValid || loading}
              style={{
                opacity: (!isConfirmValid || loading) ? 0.5 : 1,
                cursor: (!isConfirmValid || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;