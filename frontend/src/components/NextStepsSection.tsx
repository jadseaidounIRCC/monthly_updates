import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { NextStep } from '../types';
import CommentIcon from './CommentIcon';

interface NextStepsSectionProps {
  projectId: string;
  periodId: string;
}

const NextStepsSection: React.FC<NextStepsSectionProps> = ({
  projectId,
  periodId
}) => {
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStep, setEditingStep] = useState<NextStep | null>(null);

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    // Load next steps from API
    setNextSteps([
      {
        id: '1',
        projectId,
        periodId,
        description: 'Complete user acceptance testing',
        owner: 'John Doe',
        dueDate: '2024-08-30',
        status: 'in-progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        projectId,
        periodId,
        description: 'Deploy to production environment',
        owner: 'Jane Smith',
        dueDate: '2024-09-15',
        status: 'not-started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  }, [projectId, periodId]);

  const getStatusColor = (status: NextStep['status']) => {
    const colors = {
      'not-started': '#6b7280',
      'in-progress': '#3b82f6',
      'ongoing': '#10b981',
      'blocked': '#ef4444',
      'completed': '#059669'
    };
    return colors[status];
  };

  const getStatusLabel = (status: NextStep['status']) => {
    const labels = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'ongoing': 'Ongoing',
      'blocked': 'Blocked',
      'completed': 'Completed'
    };
    return labels[status];
  };

  return (
    <div className="next-steps-container">
      <div className="section-header">
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>
      
      <div className="steps-table-container">
        <table className="steps-table next-steps-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Owner</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {nextSteps.map((step) => (
              <tr key={step.id} data-step-id={step.id}>
                <td>{step.id}</td>
                <td className="step-description">
                  {step.description}
                  <CommentIcon
                    fieldRef={`nextSteps.${step.id}.description`}
                    projectId={projectId}
                    periodId={periodId}
                  />
                </td>
                <td className="step-owner">
                  {step.owner}
                  <CommentIcon
                    fieldRef={`nextSteps.${step.id}.owner`}
                    projectId={projectId}
                    periodId={periodId}
                  />
                </td>
                <td className="step-due-date">
                  {step.dueDate ? new Date(step.dueDate).toLocaleDateString() : '-'}
                  <CommentIcon
                    fieldRef={`nextSteps.${step.id}.dueDate`}
                    projectId={projectId}
                    periodId={periodId}
                  />
                </td>
                <td className="step-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(step.status) }}
                  >
                    {getStatusLabel(step.status)}
                  </span>
                  <CommentIcon
                    fieldRef={`nextSteps.${step.id}.status`}
                    projectId={projectId}
                    periodId={periodId}
                  />
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon"
                      onClick={() => setEditingStep(step)}
                      title="Edit step"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn-icon delete-btn"
                      onClick={() => {/* Handle delete */}}
                      title="Delete step"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal - Simple placeholder for now */}
      {(showAddModal || editingStep) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingStep(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingStep ? 'Edit Step' : 'Add New Step'}</h3>
            <p>Step form will be implemented in the next phase.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStep(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextStepsSection;