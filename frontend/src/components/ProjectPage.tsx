import React, { useState, useEffect, useCallback } from 'react';
import { ProjectPageProps, ReportingPeriod } from '../types';
import ApiService from '../services/ApiService';
import BenefitsTable from './BenefitsTable';
import ProjectSidebar from './ProjectSidebar';
import NextStepsSection from './NextStepsSection';
import ProjectUpdatesSection from './ProjectUpdatesSection';
import RiskSection from './RiskSection';
import PeriodFilter from './PeriodFilter';

const ProjectPage: React.FC<ProjectPageProps> = ({
  project,
  onProjectUpdate
}) => {
  const [currentPeriod, setCurrentPeriod] = useState<ReportingPeriod | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCurrentPeriod = useCallback(async () => {
    try {
      setLoading(true);
      const period = await ApiService.getCurrentPeriod(project.id);
      setCurrentPeriod(period);
    } catch (error) {
      console.error('Error loading current period:', error);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (project?.id) {
      loadCurrentPeriod();
    }
  }, [project?.id, loadCurrentPeriod]);

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      const updates = { [field]: value };
      const updatedProject = await ApiService.updateProject(project.id, updates);
      onProjectUpdate(updatedProject);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (!currentPeriod) {
    return (
      <div className="no-project-container">
        <div className="no-project-content">
          <h2>Unable to Load Period</h2>
          <p>Could not load the current reporting period for this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-layout">
      {/* Main Content */}
      <div className="project-main">
        {/* Period Filter */}
        <section className="content-section">
          <PeriodFilter
            selectedPeriodId={currentPeriod.id}
            onPeriodChange={(period) => setCurrentPeriod(period)}
          />
        </section>

        {/* Benefits Section */}
        <section className="content-section">
          <h3>Expected Benefits</h3>
          <BenefitsTable
            benefits={project.benefits}
            projectId={project.id}
            periodId={currentPeriod.id}
            onBenefitsUpdate={(benefits) => handleFieldUpdate('benefits', benefits)}
          />
        </section>

        {/* Key Risks/Issues */}
        <section className="content-section">
          <h3>Key Risks/Issues</h3>
          <RiskSection
            project={project}
            periodId={currentPeriod.id}
            onFieldUpdate={handleFieldUpdate}
          />
        </section>

        {/* Key Updates */}
        <section className="content-section">
          <h3>Key Updates</h3>
          <ProjectUpdatesSection
            project={project}
            periodId={currentPeriod.id}
            onFieldUpdate={handleFieldUpdate}
          />
        </section>

        {/* Next Steps */}
        <section className="content-section">
          <h3>Next Steps</h3>
          <NextStepsSection
            projectId={project.id}
            periodId={currentPeriod.id}
          />
        </section>
      </div>

      {/* Sidebar */}
      <div className="project-sidebar">
        <ProjectSidebar
          project={project}
          periodId={currentPeriod.id}
          onFieldUpdate={handleFieldUpdate}
        />
      </div>
    </div>
  );
};

export default ProjectPage;