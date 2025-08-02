import React, { useState } from 'react';
import { Plus, Moon, Sun } from 'lucide-react';
import { NavigationProps } from '../types';

const Navigation: React.FC<NavigationProps> = ({
  projects,
  activeProject,
  theme,
  onProjectSelect,
  onProjectCreate,
  onThemeToggle
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        onProjectSelect(project);
      }
    }
  };

  return (
    <nav className="nav-container">
      <div className="nav-brand">
        <h1>Monthly Updates</h1>
      </div>
      
      <div className="nav-tabs">
        <div className="project-selector">
          <select 
            value={activeProject?.id || ''} 
            onChange={handleProjectChange}
            className="project-select"
          >
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Period Filter - We'll add this later in Phase 2C */}
        <div className="period-selector">
          <select className="period-select">
            <option value="">Current Period (Aug 2024)</option>
            <option value="2024-07">July 2024</option>
            <option value="2024-06">June 2024</option>
            <option value="2024-05">May 2024</option>
          </select>
        </div>
      </div>
      
      <div className="nav-actions">
        <button 
          className="btn btn-create-project"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
        
        <button 
          className="theme-toggle"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      
      {/* Create Project Modal - Simple for now */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create New Project</h3>
            <p>Project creation form will be implemented in the next phase.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;