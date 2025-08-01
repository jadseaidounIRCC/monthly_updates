// Main Application
class MonthlyUpdatesApp {
    constructor() {
        this.navigation = null;
        this.projectManager = null;
        this.modalManager = null;
        this.commentManager = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        try {
            // Initialize components
            this.modalManager = new ModalManager();
            this.projectManager = new ProjectManager();
            this.navigation = new Navigation();
            this.commentManager = new CommentManager(this);

            // Make components globally accessible
            window.navigation = this.navigation;
            window.commentManager = this.commentManager;

            // Initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }

            // Bind global events
            this.bindGlobalEvents();

            // Check for any startup messages
            this.checkStartupMessages();

            console.log('Monthly Updates App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorMessage('Failed to initialize application. Please refresh the page.');
        }
    }

    bindGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.matches('input, textarea, select, [contenteditable]')) {
                return;
            }

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.navigation.showCreateProjectModal();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentProject();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.printCurrentProject();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportCurrentProject();
                        break;
                    case 't':
                        e.preventDefault();
                        this.navigation.toggleTheme();
                        break;
                    case 'w':
                        e.preventDefault();
                        this.closeCurrentProject();
                        break;
                    case '/':
                        e.preventDefault();
                        this.modalManager.showKeyboardShortcuts();
                        break;
                    default:
                        // Handle number keys for project switching
                        if (e.key >= '1' && e.key <= '9') {
                            e.preventDefault();
                            const projectIndex = parseInt(e.key) - 1;
                            this.switchToProjectByIndex(projectIndex);
                        }
                        break;
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', Helpers.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle visibility change (tab focus/blur)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handleAppFocus();
            }
        });

        // Auto-refresh reporting periods daily
        this.startPeriodicRefresh();

        // Handle beforeunload (page refresh/close)
        window.addEventListener('beforeunload', (e) => {
            // Auto-save current project if there are unsaved changes
            if (this.hasUnsavedChanges()) {
                this.saveCurrentProject();
            }
        });

        // Global click handler for external actions
        document.addEventListener('click', (e) => {
            // Handle data-action attributes
            const action = e.target.dataset.action;
            if (action) {
                e.preventDefault();
                this.handleAction(action, e.target);
            }
        });

        // Handle modal close events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, .modal[data-close-on-outside-click="true"]')) {
                const modal = e.target.closest('.modal') || e.target;
                this.modalManager.closeModal(modal);
            }
        });
    }

    handleAction(action, element) {
        const projectId = element.dataset.projectId;
        
        switch (action) {
            case 'export-project':
                if (projectId) {
                    this.projectManager.exportProject(projectId);
                } else {
                    this.exportCurrentProject();
                }
                break;
            case 'print-project':
                if (projectId) {
                    this.projectManager.printProject(projectId);
                } else {
                    this.printCurrentProject();
                }
                break;
            case 'clone-project':
                if (projectId) {
                    this.cloneProject(projectId);
                }
                break;
            case 'export-all':
                this.projectManager.exportAllProjects();
                break;
            case 'import-project':
                this.importProject();
                break;
            case 'import-all':
                this.importAllProjects();
                break;
            case 'show-shortcuts':
                this.modalManager.showKeyboardShortcuts();
                break;
            case 'clear-data':
                this.clearAllData();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    saveCurrentProject() {
        if (this.navigation.activeProjectId) {
            this.navigation.saveProjectData(this.navigation.activeProjectId);
            Helpers.showToast('Project saved', 'success');
        }
    }

    printCurrentProject() {
        if (this.navigation.activeProjectId) {
            this.projectManager.printProject(this.navigation.activeProjectId);
        } else {
            Helpers.showToast('No active project to print', 'warning');
        }
    }

    exportCurrentProject() {
        if (this.navigation.activeProjectId) {
            this.projectManager.exportProject(this.navigation.activeProjectId);
        } else {
            Helpers.showToast('No active project to export', 'warning');
        }
    }

    closeCurrentProject() {
        if (this.navigation.activeProjectId) {
            this.navigation.closeProject(this.navigation.activeProjectId);
        }
    }

    switchToProjectByIndex(index) {
        if (this.navigation.projects[index]) {
            this.navigation.switchToProject(this.navigation.projects[index].id);
        }
    }

    async cloneProject(projectId) {
        try {
            const project = DataManager.getProject(projectId);
            if (!project) {
                Helpers.showToast('Project not found', 'error');
                return;
            }

            const cloned = project.clone();
            DataManager.saveProject(cloned);
            
            this.navigation.loadProjects();
            this.navigation.switchToProject(cloned.id);
            
            Helpers.showToast('Project cloned successfully', 'success');
        } catch (error) {
            console.error('Error cloning project:', error);
            Helpers.showToast('Failed to clone project', 'error');
        }
    }

    async importProject() {
        try {
            const file = await this.modalManager.showFilePicker('.json', false);
            if (file) {
                this.projectManager.importProject(file);
            }
        } catch (error) {
            console.error('Error importing project:', error);
            Helpers.showToast('Failed to import project', 'error');
        }
    }

    async importAllProjects() {
        try {
            const file = await this.modalManager.showFilePicker('.json', false);
            if (file) {
                this.projectManager.importAllProjects(file);
            }
        } catch (error) {
            console.error('Error importing projects:', error);
            Helpers.showToast('Failed to import projects', 'error');
        }
    }

    async clearAllData() {
        const confirmed = await this.modalManager.showConfirmModal(
            'Clear All Data',
            'This will permanently delete all projects and settings. This action cannot be undone.',
            'Delete All',
            'Cancel'
        );

        if (confirmed) {
            try {
                Storage.clear();
                location.reload();
            } catch (error) {
                console.error('Error clearing data:', error);
                Helpers.showToast('Failed to clear data', 'error');
            }
        }
    }

    handleResize() {
        // Handle responsive behavior if needed
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile', isMobile);
    }

    handleAppFocus() {
        // Refresh data when app regains focus (in case data was modified elsewhere)
        if (this.navigation) {
            this.navigation.loadProjects();
            // Also refresh reporting periods in case date changed
            this.refreshReportingPeriods();
        }
    }

    startPeriodicRefresh() {
        // Check every hour if we need to update reporting periods
        setInterval(() => {
            this.refreshReportingPeriods();
        }, 60 * 60 * 1000); // 1 hour

        // Also check when the app regains focus
        this.lastRefreshDate = new Date().toDateString();
    }

    refreshReportingPeriods() {
        const today = new Date().toDateString();
        
        // Only refresh if the date has actually changed
        if (this.lastRefreshDate !== today) {
            this.lastRefreshDate = today;
            
            // Refresh the current project display
            if (this.navigation && this.navigation.activeProjectId) {
                const projectPage = document.getElementById(`project-page-${this.navigation.activeProjectId}`);
                if (projectPage) {
                    const project = DataManager.getProject(this.navigation.activeProjectId);
                    if (project) {
                        this.navigation.populateProjectPage(project);
                    }
                }
            }
        }
    }

    hasUnsavedChanges() {
        // Simple check - in a real app you might track dirty state
        return false;
    }

    checkStartupMessages() {
        // Check for any startup messages or welcome flows
        const projects = DataManager.getProjects();
        
        if (projects.length === 0) {
            // First time user - maybe show a welcome tour
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 1000);
        }
    }

    showWelcomeMessage() {
        Helpers.showToast(
            'Welcome to Monthly Updates! Create your first project to get started.',
            'info',
            5000
        );
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--error-color);
            color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            text-align: center;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Error</h3>
            <p style="margin-bottom: 1.5rem;">${Helpers.escapeHtml(message)}</p>
            <button onclick="location.reload()" class="btn" style="background: white; color: var(--error-color);">
                Reload Page
            </button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    // Public API methods
    getCurrentProject() {
        return DataManager.getActiveProject();
    }

    getProjectStats() {
        const projects = DataManager.getProjects();
        const activeProject = this.getCurrentProject();
        
        return {
            totalProjects: projects.length,
            activeProject: activeProject ? activeProject.name : null,
            lastUpdated: projects.length > 0 ? 
                Math.max(...projects.map(p => new Date(p.updatedAt).getTime())) : null
        };
    }

    // Development/debugging methods
    getDebugInfo() {
        return {
            version: '1.0.0',
            userAgent: navigator.userAgent,
            storage: {
                available: typeof Storage !== 'undefined',
                used: this.getStorageUsage()
            },
            projects: DataManager.getProjects().length,
            activeProject: this.navigation.activeProjectId,
            theme: Storage.getTheme()
        };
    }

    getStorageUsage() {
        try {
            const data = JSON.stringify(localStorage);
            return {
                size: data.length,
                sizeFormatted: Helpers.formatFileSize(data.length * 2) // Rough estimate (UTF-16)
            };
        } catch (error) {
            return { size: 0, sizeFormatted: '0 bytes' };
        }
    }

    // Notification system for CommentManager
    showNotification(message, type = 'info') {
        // Use existing toast system
        Helpers.showToast(message, type);
    }

    // Error message display
    showErrorMessage(message) {
        console.error(message);
        Helpers.showToast(message, 'error');
    }
}

// Initialize app when script loads
window.app = new MonthlyUpdatesApp();

// Make key classes globally available for debugging
window.DataManager = DataManager;
window.Helpers = Helpers;
window.Storage = Storage;
window.Project = Project;
window.NextStep = NextStep;