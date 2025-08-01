import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Zap
} from 'lucide-react';
import { Project } from '../types';
import { Helpers } from '../utils/helpers';

interface DashboardProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

type ViewMode = 'overview' | 'benefits' | 'timeline' | 'team';

const Dashboard: React.FC<DashboardProps> = ({ projects, onProjectSelect }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const currentPeriod = Helpers.calculateReportingPeriod();
    
    // Project stage distribution
    const stageDistribution = projects.reduce((acc, project) => {
      const stage = project.currentProjectStage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Benefits analysis
    const benefitsAnalysis = projects.reduce((acc, project) => {
      Object.entries(project.benefits || {}).forEach(([type, benefit]) => {
        if (benefit.applicable === 'yes') {
          acc[type] = (acc[type] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Team leads analysis - only count actual assigned leads
    const teamLeads = projects.reduce((acc, project) => {
      const lead = project.devTeamLead;
      if (lead && lead.trim()) { // Only count if there's an actual assigned lead
        if (!acc[lead]) {
          acc[lead] = { projects: 0, stages: {} };
        }
        acc[lead].projects += 1;
        const stage = project.currentProjectStage || 'unknown';
        acc[lead].stages[stage] = (acc[lead].stages[stage] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, { projects: number; stages: Record<string, number> }>);

    // TODO: Fetch actual next steps data from API
    const totalSteps = 0; // Will be replaced with real data when next steps API is implemented

    return {
      totalProjects,
      currentPeriod,
      stageDistribution,
      benefitsAnalysis,
      teamLeads,
      totalSteps
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (filterStage === 'all') return projects;
    return projects.filter(p => p.currentProjectStage === filterStage);
  }, [projects, filterStage]);

  const getStageColor = (stage: string) => {
    const colors = {
      prototype: '#8b5cf6', // Purple
      poc: '#f59e0b',       // Amber
      pilot: '#10b981',     // Emerald
      unknown: '#6b7280'    // Gray
    };
    return colors[stage as keyof typeof colors] || colors.unknown;
  };

  const getStageGradient = (stage: string) => {
    const gradients = {
      prototype: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      poc: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      pilot: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      unknown: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    };
    return gradients[stage as keyof typeof gradients] || gradients.unknown;
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'prototype': return <Zap size={16} />;
      case 'poc': return <Target size={16} />;
      case 'pilot': return <Activity size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h2 className="dashboard-title">Project Overview Dashboard</h2>
          <div className="dashboard-period">
            <span className="period-label">Reporting Period:</span>
            <span className="period-dates">{metrics.currentPeriod.periodString}, {metrics.currentPeriod.startDate.getFullYear()}</span>
            <span className="period-month">{metrics.currentPeriod.periodName.split(' ')[0]}</span>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="dashboard-view-toggle">
          {(['overview', 'benefits', 'timeline', 'team'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              className={`view-toggle-btn ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'overview' && <BarChart3 size={16} />}
              {mode === 'benefits' && <TrendingUp size={16} />}
              {mode === 'timeline' && <Calendar size={16} />}
              {mode === 'team' && <Users size={16} />}
              <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <BarChart3 size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalProjects}</div>
            <div className="metric-label">Total Projects</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <CheckCircle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Object.values(metrics.benefitsAnalysis).reduce((a, b) => a + b, 0)}</div>
            <div className="metric-label">Active Benefits</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Object.keys(metrics.teamLeads).length}</div>
            <div className="metric-label">Team Leads</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalSteps}</div>
            <div className="metric-label">Total Next Steps</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {viewMode === 'overview' && (
          <div className="overview-layout">
            {/* Project Stage Distribution */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Project Stage Distribution</h3>
                <PieChart size={20} />
              </div>
              <div className="stage-distribution">
                {Object.entries(metrics.stageDistribution).map(([stage, count]) => (
                  <div key={stage} className="stage-item">
                    <div className="stage-info">
                      <div className="stage-icon" style={{ background: getStageGradient(stage) }}>
                        {getStageIcon(stage)}
                      </div>
                      <span className="stage-name">{stage || 'Unknown'}</span>
                    </div>
                    <div className="stage-stats">
                      <span className="stage-count">{count}</span>
                      <div 
                        className="stage-bar" 
                        style={{ 
                          width: `${(count / metrics.totalProjects) * 100}%`,
                          background: getStageGradient(stage)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Overview */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Benefits Implementation</h3>
                <TrendingUp size={20} />
              </div>
              <div className="benefits-overview">
                {Object.entries(metrics.benefitsAnalysis).map(([type, count]) => (
                  <div key={type} className="benefit-item">
                    <div className="benefit-name">
                      {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="benefit-count">{count} projects</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'team' && (
          <div className="team-layout">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Team Lead Distribution</h3>
                <Users size={20} />
              </div>
              <div className="team-leads">
                {Object.entries(metrics.teamLeads).map(([lead, data], index) => {
                  const avatarGradients = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
                  ];
                  return (
                    <div key={lead} className="team-lead-item">
                      <div className="lead-info">
                        <div className="lead-avatar" style={{ background: avatarGradients[index % avatarGradients.length] }}>
                          {lead.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </div>
                      <div className="lead-details">
                        <div className="lead-name">{lead}</div>
                        <div className="lead-projects">{data.projects} projects</div>
                      </div>
                    </div>
                    <div className="lead-stages">
                      {Object.entries(data.stages).map(([stage, count]) => (
                        <div key={stage} className="stage-chip" style={{ background: getStageGradient(stage) }}>
                          {stage}: {count}
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Project Cards Grid */}
        <div className="dashboard-card projects-grid-card">
          <div className="card-header">
            <h3>Project Details</h3>
            <div className="card-filters">
              <select 
                value={filterStage} 
                onChange={(e) => setFilterStage(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Stages</option>
                <option value="prototype">Prototype</option>
                <option value="poc">Proof of Concept</option>
                <option value="pilot">Pilot</option>
              </select>
            </div>
          </div>
          
          <div className="projects-grid">
            {filteredProjects.map(project => (
              <div 
                key={project.id} 
                className="project-card"
                onClick={() => onProjectSelect(project)}
              >
                <div className="project-card-header">
                  <div className="project-name">{project.name}</div>
                  <div 
                    className="project-stage-badge"
                    style={{ background: getStageGradient(project.currentProjectStage || 'unknown') }}
                  >
                    {getStageIcon(project.currentProjectStage || 'unknown')}
                    {project.currentProjectStage || 'Unknown'}
                  </div>
                </div>
                
                <div className="project-card-content">
                  <div className="project-field">
                    <Users size={14} />
                    <span>{project.devTeamLead || 'No lead assigned'}</span>
                  </div>
                  
                  <div className="project-field">
                    <Target size={14} />
                    <span>Next steps: N/A</span>
                  </div>
                  
                  {project.budget && (
                    <div className="project-field">
                      <DollarSign size={14} />
                      <span>{project.budget}</span>
                    </div>
                  )}
                </div>
                
                <div className="project-benefits">
                  {Object.entries(project.benefits || {}).map(([type, benefit]) => (
                    benefit.applicable === 'yes' && (
                      <div key={type} className="benefit-tag">
                        {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;