// Navigation Component
class Navigation {
    constructor() {
        this.activeProjectId = null;
        this.projects = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProjects();
        this.initTheme();
    }

    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Add project button
        const addProjectBtn = document.getElementById('add-project-btn');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => this.showCreateProjectModal());
        }

        // Create first project button
        const createFirstBtn = document.getElementById('create-first-project');
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', () => this.showCreateProjectModal());
        }
    }

    initTheme() {
        const savedTheme = Storage.getTheme();
        document.body.className = savedTheme;
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light';
        const newTheme = currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
        
        document.body.className = newTheme;
        Storage.setTheme(newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#theme-toggle .theme-icon');
        if (themeIcon) {
            const iconName = theme === 'theme-dark' ? 'sun' : 'moon';
            themeIcon.setAttribute('data-lucide', iconName);
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    loadProjects() {
        this.projects = DataManager.getProjects();
        this.activeProjectId = Storage.getActiveProjectId();
        this.renderTabs();
        this.showActivePage();
    }

    renderTabs() {
        const tabsContainer = document.getElementById('project-tabs');
        if (!tabsContainer) return;

        if (this.projects.length === 0) {
            tabsContainer.innerHTML = '';
            this.showWelcomePage();
            return;
        }

        // Find active project
        const activeProject = this.projects.find(p => p.id === this.activeProjectId) || this.projects[0];

        // Render dropdown with active project and all projects
        tabsContainer.innerHTML = `
            <div class="projects-dropdown">
                <button class="projects-dropdown-toggle ${activeProject ? 'active' : ''}" id="projects-dropdown-toggle">
                    <i data-lucide="folder"></i>
                    <span class="project-name">${activeProject ? Helpers.escapeHtml(activeProject.name) : 'Select Project'}</span>
                    <i data-lucide="chevron-down" style="width: 1rem; height: 1rem;"></i>
                </button>
                <div class="projects-dropdown-menu" id="projects-dropdown-menu">
                    <div class="dropdown-header">Projects (${this.projects.length})</div>
                    ${this.projects.map(project => {
                        const period = project.getReportingPeriod();
                        return `
                            <div class="dropdown-project-item ${project.id === this.activeProjectId ? 'active' : ''}" 
                                    data-project-id="${project.id}">
                                <button class="project-item-content" data-project-id="${project.id}">
                                    <i data-lucide="folder"></i>
                                    <div style="flex: 1;">
                                        <div class="project-name">${Helpers.escapeHtml(project.name)}</div>
                                        <div class="project-period">${period.periodString}</div>
                                    </div>
                                </button>
                                <button class="delete-btn" data-project-id="${project.id}" title="Delete project">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Re-initialize lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        this.bindTabEvents();
    }

    bindTabEvents() {
        const tabsContainer = document.getElementById('project-tabs');
        if (!tabsContainer) return;

        // Dropdown toggle
        const dropdownToggle = document.getElementById('projects-dropdown-toggle');
        const dropdownMenu = document.getElementById('projects-dropdown-menu');

        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.projects-dropdown')) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }

        // Project item click events
        tabsContainer.addEventListener('click', (e) => {
            const projectButton = e.target.closest('.project-item-content');
            const deleteButton = e.target.closest('.delete-btn');

            if (deleteButton) {
                e.stopPropagation();
                const projectId = deleteButton.dataset.projectId;
                this.deleteProject(projectId);
            } else if (projectButton) {
                e.stopPropagation();
                const projectId = projectButton.dataset.projectId;
                this.switchToProject(projectId);
                // Close dropdown after selection
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                }
            }
        });
    }

    switchToProject(projectId) {
        if (this.activeProjectId === projectId) return;

        this.activeProjectId = projectId;
        Storage.setActiveProjectId(projectId);
        
        // Update dropdown display
        this.renderTabs();

        this.showProjectPage(projectId);
    }


    showCreateProjectModal() {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        const nameInput = document.getElementById('project-name-input');
        
        if (!modal || !form || !nameInput) return;

        // Reset form
        form.reset();
        nameInput.focus();

        // Show modal
        modal.classList.add('show');

        // Handle form submission
        const submitHandler = (e) => {
            e.preventDefault();
            
            const name = nameInput.value.trim();
            if (!name) {
                Helpers.showToast('Project name is required', 'error');
                nameInput.focus();
                return;
            }

            if (name.length > 100) {
                Helpers.showToast('Project name must be less than 100 characters', 'error');
                nameInput.focus();
                return;
            }

            // Check for duplicate names
            if (this.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                Helpers.showToast('A project with this name already exists', 'error');
                nameInput.focus();
                return;
            }

            try {
                const project = DataManager.createProject(name);
                this.projects.push(project);
                this.switchToProject(project.id);
                this.renderTabs();
                
                modal.classList.remove('show');
                Helpers.showToast('Project created successfully', 'success');
            } catch (error) {
                console.error('Error creating project:', error);
                Helpers.showToast('Failed to create project', 'error');
            }

            form.removeEventListener('submit', submitHandler);
        };

        form.addEventListener('submit', submitHandler);
    }

    showWelcomePage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show welcome page
        const welcomePage = document.getElementById('welcome-page');
        if (welcomePage) {
            welcomePage.classList.add('active');
        }
    }

    showProjectPage(projectId) {
        const project = DataManager.getProject(projectId);
        if (!project) {
            Helpers.showToast('Project not found', 'error');
            return;
        }

        this.hideAllPages();
        
        // Create or get project page
        let projectPage = document.getElementById(`project-page-${projectId}`);
        if (!projectPage) {
            projectPage = this.createProjectPage(project);
        }

        projectPage.classList.add('active');
        this.populateProjectPage(project);
    }

    hideAllPages() {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
    }

    createProjectPage(project) {
        const template = document.getElementById('project-page-template');
        if (!template) return null;

        const clone = template.cloneNode(true);
        clone.id = `project-page-${project.id}`;
        clone.style.display = '';
        clone.classList.remove('active');

        // Add to main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.appendChild(clone);
        }

        return clone;
    }

    populateProjectPage(project) {
        const projectPage = document.getElementById(`project-page-${project.id}`);
        if (!projectPage) return;

        // Update project header
        const projectName = projectPage.querySelector('.project-name');
        if (projectName) {
            projectName.textContent = project.name;
        }

        const periodDates = projectPage.querySelector('.period-dates');
        const periodMonth = projectPage.querySelector('.period-month');
        if (periodDates) {
            // Always use current reporting period (auto-updating)
            const period = project.getReportingPeriod();
            periodDates.textContent = period.periodString;
            
            if (periodMonth) {
                periodMonth.textContent = period.periodName.split(' ')[0]; // Just the month name
            }
        }

        // Populate project details in sidebar
        this.populateProjectDetails(projectPage, project);
        
        // Populate content sections
        this.populateProjectContent(projectPage, project);
        
        // Bind events for this project page
        this.bindProjectPageEvents(projectPage, project);
    }

    populateProjectDetails(projectPage, project) {
        // Map inputs by their position in the sidebar
        const inputs = projectPage.querySelectorAll('.detail-input');
        if (inputs.length >= 9) {
            inputs[0].value = project.businessLead || '';           // Business Lead
            inputs[1].value = project.initiator || '';              // Initiator
            inputs[2].value = project.devTeamLead || '';            // Dev Team Lead
            inputs[3].value = project.projectStartDate ? Helpers.formatDateForInput(project.projectStartDate) : '';
            inputs[4].value = project.currentProjectStage || '';    // Current Project Development Stage
            inputs[5].value = project.currentAiStage || '';         // Current AI Lifecycle Stage
            inputs[6].value = project.targetNextStageDate ? Helpers.formatDateForInput(project.targetNextStageDate) : '';
            inputs[7].value = project.targetCompletionDate ? Helpers.formatDateForInput(project.targetCompletionDate) : '';
            inputs[8].value = project.budget || '';                 // Budget
        }
    }

    populateProjectContent(projectPage, project) {
        // Description
        const descriptionContent = projectPage.querySelector('.description-content');
        if (descriptionContent) {
            descriptionContent.innerHTML = project.description || '';
            if (!project.description) {
                descriptionContent.innerHTML = '<span class="placeholder">Click to add project description...</span>';
            }
        }

        // Benefits
        this.populateBenefits(projectPage, project);

        // Key risks
        const risksContent = projectPage.querySelector('.risks-content');
        if (risksContent) {
            risksContent.value = project.keyRisks || '';
        }

        // Key updates
        const updatesContent = projectPage.querySelector('.updates-content');
        if (updatesContent) {
            updatesContent.value = project.keyUpdates || '';
        }

        // Next steps
        this.populateNextSteps(projectPage, project);
    }

    populateBenefits(projectPage, project) {
        const benefitTypes = ['fteSavings', 'costSavings', 'programIntegrity', 'clientService', 'other'];
        
        benefitTypes.forEach((type, index) => {
            const row = projectPage.querySelector(`.benefits-table tbody tr:nth-child(${index + 1})`);
            if (row && project.benefits[type]) {
                const applicableSelect = row.querySelector('.benefit-applicable');
                const detailsTextarea = row.querySelector('.benefit-details');
                
                if (applicableSelect) {
                    applicableSelect.value = project.benefits[type].applicable || '';
                }
                
                if (detailsTextarea) {
                    detailsTextarea.value = project.benefits[type].details || '';
                }
            }
        });
    }

    populateNextSteps(projectPage, project) {
        const tbody = projectPage.querySelector('#steps-tbody');
        if (!tbody) return;

        tbody.innerHTML = project.nextSteps.map((step, index) => `
            <tr data-step-id="${step.id}">
                <td>${index + 1}</td>
                <td>${Helpers.escapeHtml(step.description)}</td>
                <td>${Helpers.escapeHtml(step.owner)}</td>
                <td>${step.dueDate ? Helpers.formatDate(step.dueDate) : ''}</td>
                <td>
                    <span class="status-badge ${step.status}">
                        ${NextStep.fromJSON(step).getStatusInfo().label}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editStep('${project.id}', '${step.id}')" title="Edit">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteStep('${project.id}', '${step.id}')" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Re-initialize lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    bindProjectPageEvents(projectPage, project) {
        // Auto-save functionality with debouncing
        const autoSave = Helpers.debounce(() => {
            console.log('Auto-saving project:', project.id);
            this.saveProjectData(project.id);
        }, 1000);

        // Description content editable
        const descriptionContent = projectPage.querySelector('.description-content');
        if (descriptionContent) {
            descriptionContent.addEventListener('input', autoSave);
            descriptionContent.addEventListener('blur', () => this.saveProjectData(project.id));
            
            // Make it properly editable
            descriptionContent.setAttribute('contenteditable', 'true');
            descriptionContent.addEventListener('focus', () => {
                if (descriptionContent.textContent === 'Click to add project description...') {
                    descriptionContent.textContent = '';
                }
            });
        }

        // Detail inputs
        projectPage.querySelectorAll('.detail-input').forEach(input => {
            input.addEventListener('input', autoSave);
            input.addEventListener('blur', () => this.saveProjectData(project.id));
        });

        // Benefits
        projectPage.querySelectorAll('.benefit-applicable, .benefit-details').forEach(input => {
            input.addEventListener('input', autoSave);
            input.addEventListener('blur', () => this.saveProjectData(project.id));
        });

        // Content textareas
        projectPage.querySelectorAll('.risks-content, .updates-content').forEach(textarea => {
            textarea.addEventListener('input', autoSave);
            textarea.addEventListener('blur', () => this.saveProjectData(project.id));
        });

        // Add step button
        const addStepBtn = projectPage.querySelector('#add-step-btn');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => {
                window.showAddStepModal(project.id);
            });
        }

        // Edit and delete project buttons
        const editBtn = projectPage.querySelector('#edit-project-btn');
        const deleteBtn = projectPage.querySelector('#delete-project-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editProject(project.id));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteProject(project.id));
        }
    }

    saveProjectData(projectId) {
        try {
            const project = DataManager.getProject(projectId);
            if (!project) return;

            const projectPage = document.getElementById(`project-page-${projectId}`);
            if (!projectPage) return;

            // Save description
            const descriptionContent = projectPage.querySelector('.description-content');
            if (descriptionContent) {
                project.description = descriptionContent.textContent || '';
            }

            // Save details by position
            const inputs = projectPage.querySelectorAll('.detail-input');
            if (inputs.length >= 9) {
                project.businessLead = inputs[0].value;
                project.initiator = inputs[1].value;
                project.devTeamLead = inputs[2].value;
                project.projectStartDate = inputs[3].value;
                project.currentProjectStage = inputs[4].value;
                project.currentAiStage = inputs[5].value;
                project.targetNextStageDate = inputs[6].value;
                project.targetCompletionDate = inputs[7].value;
                project.budget = inputs[8].value;
            }

            // Save benefits
            const benefitTypes = ['fteSavings', 'costSavings', 'programIntegrity', 'clientService', 'other'];
            benefitTypes.forEach((type, index) => {
                const row = projectPage.querySelector(`.benefits-table tbody tr:nth-child(${index + 1})`);
                if (row) {
                    const applicableSelect = row.querySelector('.benefit-applicable');
                    const detailsTextarea = row.querySelector('.benefit-details');
                    
                    if (!project.benefits[type]) {
                        project.benefits[type] = { applicable: '', details: '' };
                    }
                    
                    if (applicableSelect) {
                        project.benefits[type].applicable = applicableSelect.value;
                    }
                    
                    if (detailsTextarea) {
                        project.benefits[type].details = detailsTextarea.value;
                    }
                }
            });

            // Save content sections
            const risksContent = projectPage.querySelector('.risks-content');
            if (risksContent) {
                project.keyRisks = risksContent.value;
            }

            const updatesContent = projectPage.querySelector('.updates-content');
            if (updatesContent) {
                project.keyUpdates = updatesContent.value;
            }

            DataManager.saveProject(project);
            
        } catch (error) {
            console.error('Error saving project data:', error);
            Helpers.showToast('Failed to save project data', 'error');
        }
    }

    editProject(projectId) {
        // For now, just show project name edit
        const project = DataManager.getProject(projectId);
        if (!project) return;

        const newName = prompt('Enter new project name:', project.name);
        if (newName && newName.trim() && newName !== project.name) {
            project.name = newName.trim();
            DataManager.saveProject(project);
            
            // Update projects array and re-render
            const projectIndex = this.projects.findIndex(p => p.id === projectId);
            if (projectIndex >= 0) {
                this.projects[projectIndex] = project;
            }
            
            this.renderTabs();
            this.populateProjectPage(project);
            
            Helpers.showToast('Project renamed successfully', 'success');
        }
    }

    deleteProject(projectId) {
        if (!Helpers.confirm('Are you sure you want to permanently delete this project? This action cannot be undone.', 'Delete Project')) {
            return;
        }

        try {
            DataManager.deleteProject(projectId);
            
            // Remove from projects array
            this.projects = this.projects.filter(p => p.id !== projectId);
            
            // Remove project page
            const projectPage = document.getElementById(`project-page-${projectId}`);
            if (projectPage) {
                projectPage.remove();
            }
            
            // Switch to another project or show welcome
            if (this.activeProjectId === projectId) {
                if (this.projects.length > 0) {
                    this.switchToProject(this.projects[0].id);
                } else {
                    this.activeProjectId = null;
                    Storage.setActiveProjectId(null);
                    this.showWelcomePage();
                }
            }
            
            this.renderTabs();
            Helpers.showToast('Project deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting project:', error);
            Helpers.showToast('Failed to delete project', 'error');
        }
    }


    showActivePage() {
        if (this.projects.length === 0) {
            this.showWelcomePage();
        } else if (this.activeProjectId) {
            this.showProjectPage(this.activeProjectId);
        } else {
            this.switchToProject(this.projects[0].id);
        }
    }
}