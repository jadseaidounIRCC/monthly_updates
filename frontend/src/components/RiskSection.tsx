import React from 'react';
import { Project } from '../types';
import CommentIcon from './CommentIcon';

interface RiskSectionProps {
  project: Project;
  periodId: string;
  onFieldUpdate: (field: string, value: any) => void;
}

const RiskSection: React.FC<RiskSectionProps> = ({
  project,
  periodId,
  onFieldUpdate
}) => {
  return (
    <div className="risk-section">
      <div className="form-field">
        <label htmlFor="current-risks">Current Risks</label>
        <div className="content-field-wrapper">
          <textarea
            id="current-risks"
            value={project.currentRisks || ''}
            onChange={(e) => onFieldUpdate('currentRisks', e.target.value)}
            placeholder="Identify current project risks and concerns..."
            rows={4}
          />
          <CommentIcon
            fieldRef="currentRisks"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="mitigation-strategies">Mitigation Strategies</label>
        <div className="content-field-wrapper">
          <textarea
            id="mitigation-strategies"
            value={project.mitigationStrategies || ''}
            onChange={(e) => onFieldUpdate('mitigationStrategies', e.target.value)}
            placeholder="Describe strategies to mitigate identified risks..."
            rows={4}
          />
          <CommentIcon
            fieldRef="mitigationStrategies"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="dependencies">Dependencies</label>
        <div className="content-field-wrapper">
          <textarea
            id="dependencies"
            value={project.dependencies || ''}
            onChange={(e) => onFieldUpdate('dependencies', e.target.value)}
            placeholder="List external dependencies and their status..."
            rows={3}
          />
          <CommentIcon
            fieldRef="dependencies"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="escalation-needed">Escalation Needed</label>
        <div className="content-field-wrapper">
          <textarea
            id="escalation-needed"
            value={project.escalationNeeded || ''}
            onChange={(e) => onFieldUpdate('escalationNeeded', e.target.value)}
            placeholder="Any issues requiring escalation or leadership attention..."
            rows={3}
          />
          <CommentIcon
            fieldRef="escalationNeeded"
            projectId={project.id}
            periodId={periodId}
          />
        </div>
      </div>
    </div>
  );
};

export default RiskSection;