import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (name.length > 100) {
      alert('Project name must be less than 100 characters');
      return;
    }

    try {
      setLoading(true);
      await onCreateProject({
        name: name.trim(),
        benefits: {
          fteSavings: { applicable: '', details: '' },
          costSavings: { applicable: '', details: '' },
          programIntegrity: { applicable: '', details: '' },
          clientService: { applicable: '', details: '' },
          other: { applicable: '', details: '' }
        }
      });
      
      // Reset form
      setName('');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div id="project-modal" className="modal show" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="project-modal-title">Create New Project</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form id="project-form" className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name-input" style={{ color: 'var(--text-primary)' }}>Project Name</label>
            <input 
              type="text" 
              id="project-name-input" 
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={{
                backgroundColor: 'var(--background-tertiary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)',
                fontSize: '1rem',
                fontWeight: '500',
                outline: 'none'
              }}
            />
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
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;