import React from 'react';
import { Project } from '../types';
import CommentIcon from './CommentIcon';

interface ProjectUpdatesSectionProps {
  project: Project;
  periodId: string;
  onFieldUpdate: (field: string, value: any) => void;
}

const ProjectUpdatesSection: React.FC<ProjectUpdatesSectionProps> = ({
  project,
  periodId,
  onFieldUpdate
}) => {
  return (
    <div className="project-updates-section">
      <div className="form-field">
        <label htmlFor="summary-of-work">Summary of Work Performed This Period</label>
        <div className="content-field-wrapper">
          <textarea
            id="summary-of-work"
            value={project.summaryOfWork || ''}
            onChange={(e) => onFieldUpdate('summaryOfWork', e.target.value)}
            placeholder="Describe the work completed this period..."
            rows={4}
          />
          <CommentIcon
            fieldRef="summaryOfWork"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="key-accomplishments">Key Accomplishments</label>
        <div className="content-field-wrapper">
          <textarea
            id="key-accomplishments"
            value={project.keyAccomplishments || ''}
            onChange={(e) => onFieldUpdate('keyAccomplishments', e.target.value)}
            placeholder="List key accomplishments and milestones..."
            rows={4}
          />
          <CommentIcon
            fieldRef="keyAccomplishments"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="challenges-faced">Challenges Faced</label>
        <div className="content-field-wrapper">
          <textarea
            id="challenges-faced"
            value={project.challengesFaced || ''}
            onChange={(e) => onFieldUpdate('challengesFaced', e.target.value)}
            placeholder="Describe any challenges or blockers encountered..."
            rows={4}
          />
          <CommentIcon
            fieldRef="challengesFaced"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="progress-notes">Progress Notes</label>
        <div className="content-field-wrapper">
          <textarea
            id="progress-notes"
            value={project.progressNotes || ''}
            onChange={(e) => onFieldUpdate('progressNotes', e.target.value)}
            placeholder="Additional progress notes and observations..."
            rows={3}
          />
          <CommentIcon
            fieldRef="progressNotes"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectUpdatesSection;