import React from 'react';
import { Project } from '../types';
import CommentIcon from './CommentIcon';

interface ProjectSidebarProps {
  project: Project;
  periodId: string;
  onFieldUpdate: (field: string, value: any) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  project,
  periodId,
  onFieldUpdate
}) => {
  return (
    <div className="sidebar-content">
      <h3>Project Details</h3>
      
      <div className="form-field">
        <label htmlFor="business-lead">Business Lead</label>
        <input
          id="business-lead"
          type="text"
          value={project.businessLead || ''}
          onChange={(e) => onFieldUpdate('businessLead', e.target.value)}
          placeholder="Enter business lead"
        />
        <CommentIcon
          fieldRef="businessLead"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="initiator">Initiator</label>
        <input
          id="initiator"
          type="text"
          value={project.initiator || ''}
          onChange={(e) => onFieldUpdate('initiator', e.target.value)}
          placeholder="Enter initiator"
        />
        <CommentIcon
          fieldRef="initiator"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="dev-team-lead">Dev Team Lead</label>
        <input
          id="dev-team-lead"
          type="text"
          value={project.devTeamLead || ''}
          onChange={(e) => onFieldUpdate('devTeamLead', e.target.value)}
          placeholder="Enter dev team lead"
        />
        <CommentIcon
          fieldRef="devTeamLead"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="project-start-date">Project Start Date</label>
        <input
          id="project-start-date"
          type="date"
          value={project.projectStartDate || ''}
          onChange={(e) => onFieldUpdate('projectStartDate', e.target.value)}
        />
        <CommentIcon
          fieldRef="projectStartDate"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="current-project-stage">Current Project Stage</label>
        <select
          id="current-project-stage"
          value={project.currentProjectStage || ''}
          onChange={(e) => onFieldUpdate('currentProjectStage', e.target.value)}
        >
          <option value="">Select</option>
          <option value="prototype">Prototype</option>
          <option value="poc">POC</option>
          <option value="pilot">Pilot</option>
        </select>
        <CommentIcon
          fieldRef="currentProjectStage"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="current-ai-stage">Current AI Stage</label>
        <select
          id="current-ai-stage"
          value={project.currentAiStage || ''}
          onChange={(e) => onFieldUpdate('currentAiStage', e.target.value)}
        >
          <option value="">Select</option>
          <option value="planning-design">Planning & Design</option>
          <option value="data-collection">Data Collection</option>
          <option value="model-building">Model Building</option>
          <option value="testing-validation">Testing & Validation</option>
          <option value="deployment">Deployment</option>
          <option value="monitoring">Monitoring</option>
        </select>
        <CommentIcon
          fieldRef="currentAiStage"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="target-next-stage-date">Target Next Stage Date</label>
        <input
          id="target-next-stage-date"
          type="date"
          value={project.targetNextStageDate || ''}
          onChange={(e) => onFieldUpdate('targetNextStageDate', e.target.value)}
        />
        <CommentIcon
          fieldRef="targetNextStageDate"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="target-completion-date">Target Completion Date</label>
        <input
          id="target-completion-date"
          type="date"
          value={project.targetCompletionDate || ''}
          onChange={(e) => onFieldUpdate('targetCompletionDate', e.target.value)}
        />
        <CommentIcon
          fieldRef="targetCompletionDate"
          projectId={project.id}
          periodId={periodId}
        />
      </div>

      <div className="form-field">
        <label htmlFor="budget">Budget</label>
        <input
          id="budget"
          type="text"
          value={project.budget || ''}
          onChange={(e) => onFieldUpdate('budget', e.target.value)}
          placeholder="Enter budget or TBD"
        />
        <CommentIcon
          fieldRef="budget"
          projectId={project.id}
          periodId={periodId}
        />
      </div>
    </div>
  );
};

export default ProjectSidebar;