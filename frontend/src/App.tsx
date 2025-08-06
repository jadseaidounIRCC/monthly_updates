import React, { useState, useEffect } from 'react';
import { Moon, Sun, Plus, Edit, Trash2, BarChart3, Save, X, Check, CalendarPlus, Loader, AlertTriangle } from 'lucide-react';
import { Project, Comment } from './types';
import ApiService from './services/ApiService';
import CommentModal from './components/CommentModal';
import CreateProjectModal from './components/CreateProjectModal';
import EditProjectModal from './components/EditProjectModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Dashboard from './components/Dashboard';
import './styles/Original.css';
import './styles/CommentIcons.css';
import './styles/Modal.css';
import './styles/Dashboard.css';

// Helper function to parse date strings correctly without timezone issues
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'welcome' | 'project' | 'dashboard'>('welcome');
  const [projectDescription, setProjectDescription] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Period dropdown state
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>>([]);
  
  // Project Details State
  const [projectDetails, setProjectDetails] = useState({
    businessLead: '',
    initiator: '',
    devTeamLead: '',
    projectStartDate: '',
    currentProjectStage: '' as 'prototype' | 'poc' | 'pilot' | '',
    currentAiStage: '' as 'planning-design' | 'data-collection' | 'model-building' | 'testing-validation' | 'deployment' | 'monitoring' | '',
    targetNextStageDate: '',
    targetCompletionDate: '',
    budget: ''
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  
  // All Benefits State - Everything is now customizable per project
  const [allProjectBenefits, setAllProjectBenefits] = useState<Array<{
    id: string;
    name: string;
    applicable: 'yes' | 'no' | '';
    details: string;
    isEditing?: boolean;
    isDefault?: boolean; // Track if it's a default benefit for styling
  }>>([]);
  const [isSavingBenefits, setIsSavingBenefits] = useState(false);
  const [showAddBenefit, setShowAddBenefit] = useState(false);
  const [newBenefitName, setNewBenefitName] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
  }>({ isOpen: false, projectId: '', projectName: '' });
  
  const [deleteBenefitModal, setDeleteBenefitModal] = useState<{
    isOpen: boolean;
    benefitId: string;
    benefitName: string;
  }>({ isOpen: false, benefitId: '', benefitName: '' });
  
  const [createPeriodModal, setCreatePeriodModal] = useState<{
    isOpen: boolean;
    isCreating: boolean;
  }>({ isOpen: false, isCreating: false });
  
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });
  
  // Comment Modal State
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    fieldRef: string;
    fieldDisplayName: string;
    projectId: string;
    periodId: string;
    comments: Comment[];
  }>({
    isOpen: false,
    fieldRef: '',
    fieldDisplayName: '',
    projectId: '',
    periodId: '',
    comments: []
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await ApiService.getProjects();
        const projects = Array.isArray(projectsData) ? projectsData : [];
        setProjects(projects);
        
        // Check for saved state in localStorage
        const savedActiveProjectId = localStorage.getItem('activeProjectId');
        const savedCurrentPage = localStorage.getItem('currentPage') as 'welcome' | 'project' | 'dashboard';
        
        if (projects.length > 0) {
          // If projects exist, default to dashboard unless we have saved state
          if (savedCurrentPage && (savedCurrentPage === 'dashboard' || savedActiveProjectId)) {
            if (savedCurrentPage === 'dashboard') {
              setCurrentPage('dashboard');
            } else if (savedActiveProjectId) {
              const savedProject = projects.find(p => p.id === savedActiveProjectId);
              if (savedProject) {
                setActiveProject(savedProject);
                setCurrentPage('project');
                setProjectDescription(savedProject.description || '');
                // Load project details
                setProjectDetails({
                  businessLead: savedProject.businessLead || '',
                  initiator: savedProject.initiator || '',
                  devTeamLead: savedProject.devTeamLead || '',
                  projectStartDate: savedProject.projectStartDate || '',
                  currentProjectStage: savedProject.currentProjectStage || '',
                  currentAiStage: savedProject.currentAiStage || '',
                  targetNextStageDate: savedProject.targetNextStageDate || '',
                  targetCompletionDate: savedProject.targetCompletionDate || '',
                  budget: savedProject.budget || ''
                });
                
                // Load project benefits with localStorage persistence
                const localBenefitsData = localStorage.getItem(`benefits_${savedProject.id}`);
                if (localBenefitsData) {
                  try {
                    const parsed = JSON.parse(localBenefitsData);
                    // Handle both old and new localStorage formats
                    if (Array.isArray(parsed)) {
                      setAllProjectBenefits(parsed);
                    } else {
                      // Old format - convert to new format
                      loadBenefitsFromProject(savedProject);
                    }
                  } catch (error) {
                    console.error('Error parsing localStorage benefits:', error);
                    loadBenefitsFromProject(savedProject);
                  }
                } else {
                  loadBenefitsFromProject(savedProject);
                }
              } else {
                // Saved project doesn't exist anymore, default to dashboard
                setCurrentPage('dashboard');
              }
            }
          } else {
            // No saved state, default to dashboard when projects exist
            setCurrentPage('dashboard');
          }
        } else {
          setCurrentPage('welcome');
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
        setCurrentPage('welcome');
      }
    };

    const loadAvailablePeriods = async () => {
      try {
        // Try to load from backend API first
        try {
          const periodsData = await ApiService.getReportingPeriods();
          if (Array.isArray(periodsData) && periodsData.length > 0) {
            // Transform backend data to match our format
            const transformedPeriods = periodsData.map(period => ({
              id: period.id,
              name: period.name,
              startDate: period.startDate,
              endDate: period.endDate,
              isActive: period.isActive || false
            }));
            setAvailablePeriods(transformedPeriods);
            
            // Set active period as default selected period if none is selected
            if (!selectedPeriod) {
              const activePeriod = transformedPeriods.find(p => p.isActive);
              if (activePeriod) {
                setSelectedPeriod(activePeriod.id);
              }
            }
            return;
          }
        } catch (apiError) {
          console.error('Backend API not available:', apiError);
          setAvailablePeriods([]); // Set empty array if API fails
        }
      } catch (error) {
        console.error('Error loading periods:', error);
      }
    };

    loadProjects();
    loadAvailablePeriods();
  }, []);

  // Auto-select periods based on current page
  useEffect(() => {
    if (availablePeriods.length > 0) {
      if (currentPage === 'dashboard') {
        // Dashboard defaults to "All Periods" for overview
        setSelectedPeriod(null);
      } else if (!selectedPeriod) {
        // Project pages default to active period if none selected
        const activePeriod = availablePeriods.find(p => p.isActive);
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id);
        }
      }
    }
  }, [currentPage, selectedPeriod, availablePeriods]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.projects-dropdown')) {
        setDropdownOpen(false);
      }
      if (!(e.target as Element).closest('.periods-dropdown')) {
        setPeriodDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Pre-warm GPU layers for modal performance
  useEffect(() => {
    // Create a temporary modal element to pre-warm GPU layers
    const preWarmModal = document.createElement('div');
    preWarmModal.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      backdrop-filter: blur(4px);
      transform: translateZ(0);
      will-change: backdrop-filter, opacity;
      opacity: 0;
      pointer-events: none;
    `;
    
    document.body.appendChild(preWarmModal);
    
    // Remove after a short delay
    const cleanup = setTimeout(() => {
      if (document.body.contains(preWarmModal)) {
        document.body.removeChild(preWarmModal);
      }
    }, 1000);
    
    return () => {
      clearTimeout(cleanup);
      if (document.body.contains(preWarmModal)) {
        document.body.removeChild(preWarmModal);
      }
    };
  }, []);

  useEffect(() => {
    // Hide HTML loading screen immediately when React app loads
    // Note: This DOM manipulation is necessary to interact with the HTML loading screen
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
    document.body.classList.add('loaded');
  }, []);

  // Theme-only effect - runs only when theme changes
  useEffect(() => {
    document.body.className = `theme-${theme} loaded`;
    
    // Ensure loading screen stays hidden during theme changes
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }, [theme]);

  // Debounced icon initialization - only when UI structure changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      }
    }, 150); // Debounce by 150ms to avoid excessive calls
    
    return () => clearTimeout(timer);
  }, [projects, activeProject, dropdownOpen, periodDropdownOpen]);



  const showDeleteConfirmation = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Use React 18's automatic batching for smoother state updates
      React.startTransition(() => {
        setDeleteModal({
          isOpen: true,
          projectId,
          projectName: project.name
        });
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await ApiService.deleteProject(deleteModal.projectId);
      const updatedProjects = projects.filter(p => p.id !== deleteModal.projectId);
      setProjects(updatedProjects);
      
      if (activeProject?.id === deleteModal.projectId) {
        if (updatedProjects.length > 0) {
          // Switch to first remaining project
          setActiveProject(updatedProjects[0]);
          setCurrentPage('project');
          setProjectDescription(updatedProjects[0].description || '');
        } else {
          // No projects left, show welcome page
          setActiveProject(null);
          setCurrentPage('welcome');
          setProjectDescription('');
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error; // Re-throw so the modal can handle the error state
    }
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProject = await ApiService.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      setActiveProject(newProject);
      setCurrentPage('project');
      setProjectDescription(newProject.description || '');
      
      // Initialize new project with default benefits
      setAllProjectBenefits(getDefaultBenefits());
      
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleUpdateProject = async (projectData: { name: string }) => {
    if (!activeProject) return;
    
    try {
      const updatedProject = await ApiService.updateProject(activeProject.id, projectData);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
      setActiveProject(updatedProject);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const handleSaveProjectDetails = async () => {
    if (!activeProject) return;
    
    setIsSavingDetails(true);
    try {
      const updatedProject = await ApiService.updateProject(activeProject.id, projectDetails);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
      setActiveProject(updatedProject);
      // Show success feedback (you could add a toast notification here)
      // Project details saved successfully
    } catch (error) {
      console.error('Error saving project details:', error);
      // Show error feedback (you could add a toast notification here)
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Default benefit templates for new projects
  const getDefaultBenefits = () => [
    { id: 'fte-savings', name: 'FTE Savings', applicable: '' as const, details: '', isDefault: true },
    { id: 'cost-savings', name: 'Cost Avoidance / Cost Savings', applicable: '' as const, details: '', isDefault: true },
    { id: 'program-integrity', name: 'Program Integrity', applicable: '' as const, details: '', isDefault: true },
    { id: 'client-service', name: 'Client Service', applicable: '' as const, details: '', isDefault: true }
  ];

  const handleAddCustomBenefit = () => {
    if (!newBenefitName.trim()) return;
    
    const newBenefit = {
      id: `custom-${Date.now()}`,
      name: newBenefitName.trim(),
      applicable: '' as 'yes' | 'no' | '',
      details: '',
      isDefault: false
    };
    
    setAllProjectBenefits(prev => [...prev, newBenefit]);
    setNewBenefitName('');
    setShowAddBenefit(false);
  };

  const showBenefitDeleteConfirmation = (benefitId: string) => {
    const benefit = allProjectBenefits.find(b => b.id === benefitId);
    if (benefit) {
      setDeleteBenefitModal({
        isOpen: true,
        benefitId,
        benefitName: benefit.name
      });
    }
  };

  const handleConfirmBenefitDelete = async () => {
    setAllProjectBenefits(prev => prev.filter(b => b.id !== deleteBenefitModal.benefitId));
    setDeleteBenefitModal({ isOpen: false, benefitId: '', benefitName: '' });
  };

  const handleEditBenefit = (id: string) => {
    setAllProjectBenefits(prev => prev.map(b => 
      b.id === id ? { ...b, isEditing: true } : { ...b, isEditing: false }
    ));
  };

  const handleSaveBenefitName = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setAllProjectBenefits(prev => prev.map(b => 
      b.id === id ? { ...b, name: newName.trim(), isEditing: false } : b
    ));
  };

  const handleCancelEditBenefit = (id: string) => {
    setAllProjectBenefits(prev => prev.map(b => 
      b.id === id ? { ...b, isEditing: false } : b
    ));
  };

  const handleSaveBenefits = async () => {
    if (!activeProject) return;
    
    setIsSavingBenefits(true);
    try {
      // Convert all benefits to database format - each benefit gets its own key
      const allBenefits = allProjectBenefits.reduce((acc, benefit) => {
        acc[benefit.id] = {
          applicable: benefit.applicable,
          details: benefit.details,
          benefitName: benefit.name, // Store the benefit name
          isDefault: benefit.isDefault || false
        };
        return acc;
      }, {} as any);

      const updatedProject = await ApiService.updateProject(activeProject.id, { benefits: allBenefits });
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
      setActiveProject(updatedProject);
      
      // Clear localStorage cache after successful save
      localStorage.removeItem(`benefits_${activeProject.id}`);
      
      // Benefits saved successfully - Fully customizable system active
    } catch (error) {
      console.error('Error saving benefits:', error);
    } finally {
      setIsSavingBenefits(false);
    }
  };

  const loadBenefitsFromProject = (project: Project) => {
    const benefits = project.benefits || {};
    
    // If project has no benefits, use default template
    if (Object.keys(benefits).length === 0) {
      setAllProjectBenefits(getDefaultBenefits());
      return;
    }
    
    // Load all benefits from database (new format or legacy format)
    const loadedBenefits = Object.entries(benefits)
      .filter(([key]) => key !== 'other') // Exclude old 'other' field
      .map(([id, benefit]: [string, any]) => {
        // Handle new format with benefitName
        if (benefit.benefitName) {
          return {
            id,
            name: benefit.benefitName,
            applicable: benefit.applicable || '',
            details: benefit.details || '',
            isDefault: benefit.isDefault || false,
            isEditing: false
          };
        }
        
        // Handle legacy format - map old IDs to names
        const legacyNames: Record<string, string> = {
          fteSavings: 'FTE Savings',
          costSavings: 'Cost Avoidance / Cost Savings',
          programIntegrity: 'Program Integrity',
          clientService: 'Client Service'
        };
        
        return {
          id,
          name: benefit.customName || legacyNames[id] || id,
          applicable: benefit.applicable || '',
          details: benefit.details || '',
          isDefault: !!legacyNames[id],
          isEditing: false
        };
      });
    
    setAllProjectBenefits(loadedBenefits);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Body className will be set by useEffect
  };

  const selectProject = (project: Project) => {
    setActiveProject(project);
    setCurrentPage('project');
    // Load project description when switching projects
    setProjectDescription(project.description || '');
    // Load project details
    setProjectDetails({
      businessLead: project.businessLead || '',
      initiator: project.initiator || '',
      devTeamLead: project.devTeamLead || '',
      projectStartDate: project.projectStartDate || '',
      currentProjectStage: project.currentProjectStage || '',
      currentAiStage: project.currentAiStage || '',
      targetNextStageDate: project.targetNextStageDate || '',
      targetCompletionDate: project.targetCompletionDate || '',
      budget: project.budget || ''
    });
    
    // Load project benefits - check localStorage first for auto-persisted data
    const localBenefitsData = localStorage.getItem(`benefits_${project.id}`);
    if (localBenefitsData) {
      try {
        const parsed = JSON.parse(localBenefitsData);
        // Handle both old and new localStorage formats
        if (Array.isArray(parsed)) {
          setAllProjectBenefits(parsed);
        } else {
          // Old format - convert to new format
          loadBenefitsFromProject(project);
        }
      } catch (error) {
        console.error('Error parsing localStorage benefits:', error);
        // Fall back to database data
        loadBenefitsFromProject(project);
      }
    } else {
      // Load from database
      loadBenefitsFromProject(project);
    }
    // Save to localStorage for persistence
    localStorage.setItem('activeProjectId', project.id);
    localStorage.setItem('currentPage', 'project');
  };

  const handleProjectSelectFromDashboard = (project: Project) => {
    selectProject(project);
  };

  // Comment Modal Functions
  const openCommentModal = async (fieldRef: string, fieldDisplayName: string, projectId: string, periodId: string) => {
    try {
      const comments = await ApiService.getComments(projectId, periodId, fieldRef);
      setCommentModal({
        isOpen: true,
        fieldRef,
        fieldDisplayName,
        projectId,
        periodId,
        comments
      });
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const closeCommentModal = () => {
    setCommentModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddComment = async (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => {
    try {
      const newComment = await ApiService.createComment(commentData);
      setCommentModal(prev => ({
        ...prev,
        comments: [...prev.comments, newComment]
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const handleEditComment = async (commentId: string, updates: { content: string }) => {
    try {
      await ApiService.updateComment(commentId, updates);
      setCommentModal(prev => ({
        ...prev,
        comments: prev.comments.map(comment => 
          comment.id === commentId ? { ...comment, ...updates } : comment
        )
      }));
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await ApiService.deleteComment(commentId);
      setCommentModal(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.id !== commentId)
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      await ApiService.updateComment(commentId, { isResolved: resolved });
      setCommentModal(prev => ({
        ...prev,
        comments: prev.comments.map(comment => 
          comment.id === commentId ? { ...comment, isResolved: resolved } : comment
        )
      }));
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  };

  const handleCreateNewPeriod = () => {
    // Check if we're still in the current period
    const activePeriod = availablePeriods.find(p => p.isActive);
    if (activePeriod) {
      const today = new Date();
      const periodEnd = parseLocalDate(activePeriod.endDate);
      
      if (today <= periodEnd) {
        // Still in current period, show warning instead
        const daysRemaining = Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const nextPeriodEnd = new Date(periodEnd);
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        nextPeriodEnd.setDate(15);
        const nextPeriodName = nextPeriodEnd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        setWarningModal({
          isOpen: true,
          title: 'Cannot Create New Period Yet',
          message: `You are still in the current period (${activePeriod.name}). Please wait ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} until ${periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to create the ${nextPeriodName} period.`
        });
        return;
      }
    }
    
    setCreatePeriodModal({ isOpen: true, isCreating: false });
  };

  const confirmCreatePeriod = async () => {
    setCreatePeriodModal(prev => ({ ...prev, isCreating: true }));
    
    try {
      await ApiService.createNewPeriod();
      
      // Refresh periods data
      const periodsData = await ApiService.getReportingPeriods();
      if (Array.isArray(periodsData) && periodsData.length > 0) {
        const transformedPeriods = periodsData.map(period => ({
          id: period.id,
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          isActive: period.isActive || false
        }));
        setAvailablePeriods(transformedPeriods);
      }
      
      // Close modal and show success
      setCreatePeriodModal({ isOpen: false, isCreating: false });
      
      // Period creation completed successfully
      
    } catch (error) {
      console.error('Error creating new period:', error);
      // Keep modal open on error
      setCreatePeriodModal(prev => ({ ...prev, isCreating: false }));
    }
  };

  const handleAddReply = async (parentId: string, replyData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => {
    try {
      const newReply = await ApiService.createComment({ ...replyData, parentId });
      setCommentModal(prev => ({
        ...prev,
        comments: prev.comments.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...(comment.replies || []), newReply] }
            : comment
        )
      }));
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  // Auto-save description with debounce
  useEffect(() => {
    if (!activeProject) return;
    
    const saveDescription = async () => {
      try {
        await ApiService.updateProject(activeProject.id, { description: projectDescription });
      } catch (error) {
        console.error('Error auto-saving description:', error);
      }
    };

    const debounceTimer = setTimeout(saveDescription, 1000);
    return () => clearTimeout(debounceTimer);
  }, [projectDescription, activeProject]);

  // Auto-persist benefits data to localStorage
  useEffect(() => {
    if (!activeProject) return;
    
    localStorage.setItem(`benefits_${activeProject.id}`, JSON.stringify(allProjectBenefits));
  }, [allProjectBenefits, activeProject]);

  // Make comment modal functions available globally for CommentIcon components
  // TODO: Refactor to pass as props instead of global assignment for better React patterns
  (window as any).openCommentModal = openCommentModal;


  return (
    <div id="app" className="app-container">
      {/* Navigation - EXACT match to original */}
      <nav id="navigation" className="nav-container">
        <div className="nav-content">
          <div className="nav-brand">
            <h1 className="nav-title">AI CoE Monthly Updates</h1>
          </div>
          <div className="nav-tabs" id="project-tabs">
            {/* Projects dropdown - Always show for dashboard access */}
            <div className="projects-dropdown">
                <button className={`projects-dropdown-toggle ${activeProject || currentPage === 'dashboard' ? 'active' : ''}`} id="projects-dropdown-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPeriodDropdownOpen(false); // Close period dropdown
                    setDropdownOpen(!dropdownOpen);
                  }}>
                  <i data-lucide={currentPage === 'dashboard' ? 'bar-chart-3' : 'folder'}></i>
                  <span className="project-name">
                    {currentPage === 'dashboard' ? 'Dashboard' : 
                     activeProject ? activeProject.name : 'Select Project'}
                  </span>
                  <i data-lucide="chevron-down" style={{width: '1rem', height: '1rem'}}></i>
                </button>
                <div className={`projects-dropdown-menu ${dropdownOpen ? 'show' : ''}`} id="projects-dropdown-menu">
                  {/* Dashboard Option */}
                  <div className={`dropdown-project-item ${currentPage === 'dashboard' ? 'active' : ''}`}>
                    <button className="project-item-content dashboard-item" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage('dashboard');
                        setActiveProject(null); // Clear active project when switching to dashboard
                        setDropdownOpen(false);
                        // Save to localStorage for persistence
                        localStorage.setItem('currentPage', 'dashboard');
                        localStorage.removeItem('activeProjectId');
                      }}>
                      <i data-lucide="bar-chart-3"></i>
                      <div style={{flex: 1}}>
                        <div className="project-name">Dashboard</div>
                        <div className="project-period">Project Overview</div>
                      </div>
                    </button>
                  </div>
                  <div className="dropdown-divider"></div>
                  {projects.length > 0 && <div className="dropdown-header">Projects ({projects.length})</div>}
                  {projects.length === 0 && <div className="dropdown-header no-projects">No projects yet</div>}
                  {projects.map(project => {
                    return (
                      <div key={project.id} className={`dropdown-project-item ${project.id === activeProject?.id ? 'active' : ''}`} 
                        data-project-id={project.id}>
                        <button className="project-item-content" data-project-id={project.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectProject(project);
                            setDropdownOpen(false);
                          }}>
                          <i data-lucide="folder"></i>
                          <div style={{flex: 1}}>
                            <div className="project-name">{project.name}</div>
                            <div className="project-period">{(() => {
                              if (selectedPeriod) {
                                const period = availablePeriods.find(p => p.id === selectedPeriod);
                                if (period) {
                                  const startDate = parseLocalDate(period.startDate);
                                  const endDate = parseLocalDate(period.endDate);
                                  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                                }
                              }
                              return 'No period selected';
                            })()}</div>
                          </div>
                        </button>
                        <button className="delete-btn" data-project-id={project.id} title="Delete project"
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteConfirmation(project.id);
                          }}>
                          <i data-lucide="trash-2"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            
            {/* Periods dropdown - Identical to projects dropdown but with yellow styling */}
            <div className="periods-dropdown">
                <button className={`periods-dropdown-toggle ${selectedPeriod ? 'active' : ''}`} id="periods-dropdown-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false); // Close projects dropdown
                    setPeriodDropdownOpen(!periodDropdownOpen);
                  }}>
                  <i data-lucide="calendar"></i>
                  <span className="period-name">
                    {selectedPeriod ? availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Select Period' : 'All Periods'}
                  </span>
                  <i data-lucide="chevron-down" style={{width: '1rem', height: '1rem'}}></i>
                </button>
                <div className={`periods-dropdown-menu ${periodDropdownOpen ? 'show' : ''}`} id="periods-dropdown-menu">
                  {/* All Periods Option - Only show on dashboard */}
                  {currentPage === 'dashboard' && (
                    <>
                      <div className={`dropdown-period-item ${!selectedPeriod ? 'active' : ''}`}>
                        <button className="period-item-content all-periods-item" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeriod(null);
                            setPeriodDropdownOpen(false);
                          }}>
                          <i data-lucide="calendar-days"></i>
                          <div style={{flex: 1}}>
                            <div className="period-name">All Periods</div>
                            <div className="period-range">View all reporting periods</div>
                          </div>
                        </button>
                      </div>
                      <div className="dropdown-divider"></div>
                    </>
                  )}
                  {availablePeriods.length > 0 && <div className="dropdown-header">Reporting Periods ({availablePeriods.length})</div>}
                  {availablePeriods.length === 0 && <div className="dropdown-header no-periods">No periods available</div>}
                  {availablePeriods.map(period => {
                    return (
                      <div key={period.id} className={`dropdown-period-item ${period.id === selectedPeriod ? 'active' : ''}`} 
                        data-period-id={period.id}>
                        <button className="period-item-content" data-period-id={period.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeriod(period.id);
                            setPeriodDropdownOpen(false);
                          }}>
                          <i data-lucide="calendar"></i>
                          <div style={{flex: 1}}>
                            <div className="period-name">{period.name}</div>
                            <div className="period-range">
                              {parseLocalDate(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {parseLocalDate(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          {period.isActive && <div className="period-status">Current</div>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>
          <div className="nav-actions">
            <button 
              id="create-period-btn" 
              className="btn btn-create-period"
              onClick={handleCreateNewPeriod}
              title="Create New Reporting Period"
            >
              <i data-lucide="calendar-plus" style={{width: '16px', height: '16px'}}></i>
              <span>New Period</span>
            </button>
            <button 
              id="add-project-btn" 
              className="btn btn-create-project"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
            <button 
              id="theme-toggle" 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} className="theme-icon" /> : <Moon size={16} className="theme-icon" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - EXACT match to original */}
      <main id="main-content" className="main-content">
        {/* Dashboard Page */}
        {currentPage === 'dashboard' && (
          <div id="dashboard-page" className="page active">
            <Dashboard 
              projects={projects} 
              onProjectSelect={handleProjectSelectFromDashboard}
              selectedPeriod={selectedPeriod}
              availablePeriods={availablePeriods}
            />
          </div>
        )}

        {/* Welcome/Empty State */}
        {currentPage === 'welcome' && (
          <div id="welcome-page" className="page active">
            <div className="welcome-container">
              <div className="welcome-content">
                <h2>Welcome to Monthly Updates</h2>
                <p>Create your first project to get started with monthly reporting</p>
                <button 
                  id="create-first-project" 
                  className="btn btn-create-project"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} />
                  Create First Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Page */}
        {currentPage === 'project' && activeProject && (
          <div id="project-page-template" className="page active">
            <div className="project-header">
              <div className="project-title-section">
                <h2 className="project-name">{activeProject.name}</h2>
                <div className="reporting-period">
                  <span className="period-label">Reporting Period:</span>
                  <span className="period-dates">{(() => {
                    if (selectedPeriod) {
                      const period = availablePeriods.find(p => p.id === selectedPeriod);
                      if (period) {
                        const startDate = parseLocalDate(period.startDate);
                        const endDate = parseLocalDate(period.endDate);
                        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      }
                    }
                    return 'No period selected';
                  })()}</span>
                  <span className="period-month">{(() => {
                    if (selectedPeriod) {
                      const period = availablePeriods.find(p => p.id === selectedPeriod);
                      if (period) {
                        return period.name.split(' ')[0].toUpperCase(); // Just the month name
                      }
                    }
                    return '';
                  })()}</span>
                </div>
              </div>
              <div className="project-actions">
                <button 
                  className="btn btn-secondary" 
                  id="edit-project-btn"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit size={16} />
                  Edit Project
                </button>
                <button 
                  className="btn btn-danger" 
                  id="delete-project-btn"
                  onClick={() => showDeleteConfirmation(activeProject.id)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>

            <div className="project-content">
              {/* Left Column: Main Content - EXACT match to original */}
              <div className="project-main">
                {/* Project Description */}
                <section className="content-section">
                  <h3>Project Description</h3>
                  <textarea 
                    className="description-content"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Click to add project description..."
                    style={{
                      minHeight: '80px',
                      resize: 'vertical',
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      padding: '8px 0',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      outline: 'none'
                    }}
                  />
                </section>

                {/* Expected Benefits */}
                <section className="content-section">
                  <div className="section-header">
                    <h3>Expected Benefits</h3>
                    <button 
                      className="btn btn-save btn-sm"
                      onClick={handleSaveBenefits}
                      disabled={isSavingBenefits}
                    >
                      <Save size={14} />
                      {isSavingBenefits ? 'Saving...' : 'Save Benefits'}
                    </button>
                  </div>
                  <div className="benefits-table-container">
                    <table className="benefits-table">
                      <thead>
                        <tr>
                          <th>Defined Benefit</th>
                          <th>Applicable</th>
                          <th>Details</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* All Benefits - Fully Customizable */}
                        {allProjectBenefits.map((benefit) => (
                          <tr key={benefit.id} className={benefit.isDefault ? 'default-benefit' : 'custom-benefit'}>
                            <td>
                              {benefit.isEditing ? (
                                <input 
                                  type="text"
                                  className="benefit-name-input"
                                  defaultValue={benefit.name}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveBenefitName(benefit.id, e.currentTarget.value);
                                    } else if (e.key === 'Escape') {
                                      handleCancelEditBenefit(benefit.id);
                                    }
                                  }}
                                  onBlur={(e) => handleSaveBenefitName(benefit.id, e.target.value)}
                                  autoFocus
                                />
                              ) : (
                                <span className={benefit.isDefault ? 'default-benefit-name' : 'custom-benefit-name'}>
                                  {benefit.name}
                                </span>
                              )}
                            </td>
                            <td>
                              <select 
                                className="benefit-applicable"
                                value={benefit.applicable}
                                onChange={(e) => setAllProjectBenefits(prev => prev.map(b => 
                                  b.id === benefit.id ? { ...b, applicable: e.target.value as any } : b
                                ))}
                              >
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                            </td>
                            <td>
                              <textarea 
                                className="benefit-details"
                                placeholder="Enter details..."
                                value={benefit.details}
                                onChange={(e) => setAllProjectBenefits(prev => prev.map(b => 
                                  b.id === benefit.id ? { ...b, details: e.target.value } : b
                                ))}
                              />
                            </td>
                            <td>
                              <div className="benefit-actions">
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleEditBenefit(benefit.id)}
                                  title="Edit benefit name"
                                  disabled={benefit.isEditing}
                                >
                                  <Edit size={12} />
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => showBenefitDeleteConfirmation(benefit.id)}
                                  title="Delete benefit"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Add New Benefit Row */}
                        {showAddBenefit ? (
                          <tr>
                            <td>
                              <input 
                                type="text"
                                className="benefit-name-input"
                                placeholder="Enter benefit name"
                                value={newBenefitName}
                                onChange={(e) => setNewBenefitName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBenefit()}
                                autoFocus
                              />
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                              <div className="benefit-actions">
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={handleAddCustomBenefit}
                                  disabled={!newBenefitName.trim()}
                                >
                                  <Check size={12} />
                                </button>
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setShowAddBenefit(false);
                                    setNewBenefitName('');
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={4}>
                              <button 
                                className="btn btn-secondary btn-sm add-benefit-btn"
                                onClick={() => setShowAddBenefit(true)}
                              >
                                <Plus size={14} />
                                Add Custom Benefit
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Key Risks/Issues */}
                <section className="content-section">
                  <h3>Key Risks/Issues</h3>
                  <div className="risks-editor">
                    <textarea className="risks-content" placeholder="• Enter first risk or issue&#10;• Add additional items on new lines&#10;• Each line will become a bullet point"></textarea>
                  </div>
                </section>

                {/* Key Updates */}
                <section className="content-section">
                  <h3>Key Updates</h3>
                  <div className="updates-editor">
                    <textarea className="updates-content" placeholder="• Enter first key update&#10;• Add additional updates on new lines&#10;• Each line will become a bullet point"></textarea>
                  </div>
                </section>

                {/* Next Steps */}
                <section className="content-section">
                  <h3>Next Steps</h3>
                  <div className="next-steps-container">
                    <div className="section-header">
                      <button className="btn btn-create-project" id="add-step-btn">
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
                        <tbody id="steps-tbody">
                          {/* Steps will be dynamically populated */}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Sidebar: Project Details */}
              <div className="project-sidebar">
                <div className="sidebar-section">
                  <div className="sidebar-header">
                    <h4>Project Details</h4>
                    <button 
                      className="btn btn-save btn-sm"
                      onClick={handleSaveProjectDetails}
                      disabled={isSavingDetails}
                    >
                      <Save size={14} />
                      {isSavingDetails ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <div className="detail-group">
                    <label>Business Lead</label>
                    <input 
                      type="text" 
                      className="detail-input" 
                      placeholder="Enter business lead name"
                      value={projectDetails.businessLead}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, businessLead: e.target.value }))}
                    />
                  </div>
                  <div className="detail-group">
                    <label>Initiator</label>
                    <input 
                      type="text" 
                      className="detail-input" 
                      placeholder="Enter initiator name"
                      value={projectDetails.initiator}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, initiator: e.target.value }))}
                    />
                  </div>
                  <div className="detail-group">
                    <label>Dev Team Lead</label>
                    <input 
                      type="text" 
                      className="detail-input" 
                      placeholder="Enter dev team lead name"
                      value={projectDetails.devTeamLead}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, devTeamLead: e.target.value }))}
                    />
                  </div>
                  <div className="detail-group">
                    <label>Project Start Date</label>
                    <input 
                      type="date" 
                      className="detail-input"
                      value={projectDetails.projectStartDate}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, projectStartDate: e.target.value }))}
                    />
                  </div>
                  <div className="detail-group">
                    <label>Current Project Development Stage</label>
                    <select 
                      className="detail-input"
                      value={projectDetails.currentProjectStage}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, currentProjectStage: e.target.value as any }))}
                    >
                      <option value="">Select stage</option>
                      <option value="prototype">Prototype</option>
                      <option value="poc">Proof of Concept</option>
                      <option value="pilot">Pilot</option>
                    </select>
                  </div>
                  <div className="detail-group">
                    <label>Current AI Lifecycle Stage</label>
                    <select 
                      className="detail-input"
                      value={projectDetails.currentAiStage}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, currentAiStage: e.target.value as any }))}
                    >
                      <option value="">Select stage</option>
                      <option value="planning-design">Planning & Design</option>
                      <option value="data-collection">Data Collection & Processing</option>
                      <option value="model-building">Model Building</option>
                      <option value="testing-validation">Testing & Validation</option>
                      <option value="deployment">Deployment</option>
                      <option value="monitoring">Monitoring & Maintenance</option>
                    </select>
                  </div>
                  <div className="detail-group">
                    <label>Target Date for Start of Next AI Lifecycle Stage</label>
                    <input 
                      type="date" 
                      className="detail-input"
                      value={projectDetails.targetNextStageDate}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, targetNextStageDate: e.target.value }))}
                    />
                  </div>
                  <div className="detail-group">
                    <label>Target Project Completion Date</label>
                    <input 
                      type="date" 
                      className="detail-input"
                      value={projectDetails.targetCompletionDate}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, targetCompletionDate: e.target.value }))}
                    />
                  </div>
                  <div className="detail-group">
                    <label>Budget</label>
                    <input 
                      type="text" 
                      className="detail-input" 
                      placeholder="Enter budget or TBD"
                      value={projectDetails.budget}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={closeCommentModal}
        fieldRef={commentModal.fieldRef}
        fieldDisplayName={commentModal.fieldDisplayName}
        projectId={commentModal.projectId}
        periodId={commentModal.periodId}
        comments={commentModal.comments}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onResolveComment={handleResolveComment}
        onAddReply={handleAddReply}
      />

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
      />

      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdateProject={handleUpdateProject}
        project={activeProject}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: '', projectName: '' })}
        onConfirm={handleConfirmDelete}
        projectName={deleteModal.projectName}
      />

      <ConfirmDeleteModal
        isOpen={deleteBenefitModal.isOpen}
        onClose={() => setDeleteBenefitModal({ isOpen: false, benefitId: '', benefitName: '' })}
        onConfirm={handleConfirmBenefitDelete}
        projectName={`"${deleteBenefitModal.benefitName}" benefit`}
      />

      {/* Create Period Confirmation Modal */}
      {createPeriodModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCreatePeriodModal({ isOpen: false, isCreating: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Reporting Period</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setCreatePeriodModal({ isOpen: false, isCreating: false })}
                disabled={createPeriodModal.isCreating}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="period-creation-info">
                <div className="current-period-info">
                  <strong>Current Period:</strong> {(() => {
                    let activePeriod = availablePeriods.find(p => p.isActive);
                    
                    // Fallback to first period if no active period found
                    if (!activePeriod && availablePeriods.length > 0) {
                      activePeriod = availablePeriods[0];
                    }
                    
                    if (activePeriod) {
                      const startDate = parseLocalDate(activePeriod.startDate);
                      const endDate = parseLocalDate(activePeriod.endDate);
                      return `${activePeriod.name} (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
                    }
                    return `No periods available`;
                  })()}
                </div>
                <div className="next-period-info">
                  <strong>New Period:</strong> {(() => {
                    let activePeriod = availablePeriods.find(p => p.isActive);
                    
                    // Fallback to first period if no active period found
                    if (!activePeriod && availablePeriods.length > 0) {
                      activePeriod = availablePeriods[0];
                    }
                    
                    if (activePeriod) {
                      const currentEnd = parseLocalDate(activePeriod.endDate);
                      const nextStart = new Date(currentEnd);
                      nextStart.setDate(nextStart.getDate() + 1); // Day after current period ends
                      const nextEnd = new Date(nextStart);
                      nextEnd.setMonth(nextEnd.getMonth() + 1);
                      nextEnd.setDate(15); // Always end on 15th of next month
                      
                      // Period name should be based on the end month (the month it covers most of)
                      const nextPeriodName = nextEnd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return `${nextPeriodName} (${nextStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
                    }
                    return 'No periods available';
                  })()}
                </div>
              </div>
              <p>
                This will create the new reporting period and copy all current projects to it.
                The current period will be locked as read-only.
              </p>
              <p><strong>Are you sure you want to continue?</strong></p>
            </div>
            <div className="modal-footer modal-footer-centered">
              <button 
                className="btn btn-danger" 
                onClick={() => setCreatePeriodModal({ isOpen: false, isCreating: false })}
                disabled={createPeriodModal.isCreating}
              >
                Cancel
              </button>
              <button 
                className="btn btn-create-period" 
                onClick={confirmCreatePeriod}
                disabled={createPeriodModal.isCreating}
              >
                {createPeriodModal.isCreating ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CalendarPlus size={16} />
                    Create New Period
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningModal.isOpen && (
        <div className="modal-overlay" onClick={() => setWarningModal({ isOpen: false, title: '', message: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="warning-modal-title">
                <AlertTriangle size={20} className="warning-icon" />
                {warningModal.title}
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setWarningModal({ isOpen: false, title: '', message: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="warning-message">{warningModal.message}</p>
            </div>
            <div className="modal-footer modal-footer-centered">
              <button 
                className="btn btn-warning" 
                onClick={() => setWarningModal({ isOpen: false, title: '', message: '' })}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;