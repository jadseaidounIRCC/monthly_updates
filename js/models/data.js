// Data Models
class Project {
    constructor(name = '', data = {}) {
        this.id = data.id || Helpers.generateId();
        this.name = name;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        
        // Project info
        this.description = data.description || '';
        this.businessLead = data.businessLead || '';
        this.initiator = data.initiator || '';
        this.devTeamLead = data.devTeamLead || '';
        this.projectStartDate = data.projectStartDate || '';
        this.currentProjectStage = data.currentProjectStage || '';
        this.currentAiStage = data.currentAiStage || '';
        this.targetNextStageDate = data.targetNextStageDate || '';
        this.targetCompletionDate = data.targetCompletionDate || '';
        this.budget = data.budget || '';
        
        // Expected benefits
        this.benefits = data.benefits || {
            fteSavings: { applicable: '', details: '' },
            costSavings: { applicable: '', details: '' },
            programIntegrity: { applicable: '', details: '' },
            clientService: { applicable: '', details: '' },
            other: { applicable: '', details: '' }
        };
        
        // Content sections
        this.keyRisks = data.keyRisks || '';
        this.keyUpdates = data.keyUpdates || '';
        
        // Next steps
        this.nextSteps = data.nextSteps || [];
    }

    // Update timestamp
    touch() {
        this.updatedAt = new Date().toISOString();
    }

    // Get reporting period
    getReportingPeriod() {
        return Helpers.calculateReportingPeriod();
    }

    // Validate project data
    validate() {
        const errors = [];
        
        if (!this.name || this.name.trim().length === 0) {
            errors.push('Project name is required');
        }
        
        if (this.name && this.name.length > 100) {
            errors.push('Project name must be less than 100 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            description: this.description,
            businessLead: this.businessLead,
            initiator: this.initiator,
            devTeamLead: this.devTeamLead,
            projectStartDate: this.projectStartDate,
            currentProjectStage: this.currentProjectStage,
            currentAiStage: this.currentAiStage,
            targetNextStageDate: this.targetNextStageDate,
            targetCompletionDate: this.targetCompletionDate,
            budget: this.budget,
            benefits: this.benefits,
            keyRisks: this.keyRisks,
            keyUpdates: this.keyUpdates,
            nextSteps: this.nextSteps
        };
    }

    // Create from JSON
    static fromJSON(data) {
        return new Project(data.name, data);
    }


    // Clone project
    clone() {
        const cloned = Project.fromJSON(this.toJSON());
        cloned.id = Helpers.generateId();
        cloned.name = `${this.name} (Copy)`;
        cloned.createdAt = new Date().toISOString();
        cloned.updatedAt = new Date().toISOString();
        return cloned;
    }
}

class NextStep {
    constructor(data = {}) {
        this.id = data.id || Helpers.generateId();
        this.description = data.description || '';
        this.owner = data.owner || '';
        this.dueDate = data.dueDate || '';
        this.status = data.status || 'not-started';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // Update timestamp
    touch() {
        this.updatedAt = new Date().toISOString();
    }

    // Validate step data
    validate() {
        const errors = [];
        
        if (!this.description || this.description.trim().length === 0) {
            errors.push('Description is required');
        }
        
        if (!this.owner || this.owner.trim().length === 0) {
            errors.push('Owner is required');
        }
        
        if (!this.status || !['not-started', 'in-progress', 'ongoing', 'blocked', 'completed'].includes(this.status)) {
            errors.push('Valid status is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get status display info
    getStatusInfo() {
        const statusMap = {
            'not-started': { label: 'Not Started', class: 'not-started' },
            'in-progress': { label: 'In Progress', class: 'in-progress' },
            'ongoing': { label: 'Ongoing', class: 'ongoing' },
            'blocked': { label: 'Blocked', class: 'blocked' },
            'completed': { label: 'Completed', class: 'completed' }
        };
        
        return statusMap[this.status] || statusMap['not-started'];
    }

    // Check if overdue
    isOverdue() {
        if (!this.dueDate || this.status === 'completed') {
            return false;
        }
        
        const due = new Date(this.dueDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        return due < now;
    }

    // Check if due soon (within 7 days)
    isDueSoon() {
        if (!this.dueDate || this.status === 'completed') {
            return false;
        }
        
        const due = new Date(this.dueDate);
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        return due >= now && due <= sevenDaysFromNow;
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            description: this.description,
            owner: this.owner,
            dueDate: this.dueDate,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Create from JSON
    static fromJSON(data) {
        return new NextStep(data);
    }
}

// Data Manager Class
class DataManager {
    // Get all projects
    static getProjects() {
        const projectsData = Storage.getProjects();
        return projectsData.map(data => Project.fromJSON(data));
    }

    // Get single project
    static getProject(projectId) {
        const projectData = Storage.getProject(projectId);
        return projectData ? Project.fromJSON(projectData) : null;
    }

    // Save project
    static saveProject(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project instance');
        }
        
        const validation = project.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        project.touch();
        return Storage.saveProject(project.toJSON());
    }

    // Delete project
    static deleteProject(projectId) {
        return Storage.deleteProject(projectId);
    }

    // Get active project
    static getActiveProject() {
        const activeId = Storage.getActiveProjectId();
        return activeId ? this.getProject(activeId) : null;
    }

    // Set active project
    static setActiveProject(projectId) {
        return Storage.setActiveProjectId(projectId);
    }

    // Create new project
    static createProject(name) {
        const project = new Project(name);
        this.saveProject(project);
        return project;
    }

    // Add next step to project
    static addNextStep(projectId, stepData) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const step = new NextStep(stepData);
        const validation = step.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        project.nextSteps.push(step.toJSON());
        this.saveProject(project);
        return step;
    }

    // Update next step
    static updateNextStep(projectId, stepId, stepData) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const stepIndex = project.nextSteps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) {
            throw new Error('Step not found');
        }
        
        const step = new NextStep({ ...project.nextSteps[stepIndex], ...stepData });
        const validation = step.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        step.touch();
        project.nextSteps[stepIndex] = step.toJSON();
        this.saveProject(project);
        return step;
    }

    // Delete next step
    static deleteNextStep(projectId, stepId) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        project.nextSteps = project.nextSteps.filter(s => s.id !== stepId);
        this.saveProject(project);
        return true;
    }

    // Export all data
    static exportData() {
        return {
            projects: Storage.getProjects(),
            activeProjectId: Storage.getActiveProjectId(),
            theme: Storage.getTheme(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Import data
    static importData(data) {
        try {
            if (!data.projects || !Array.isArray(data.projects)) {
                throw new Error('Invalid data format');
            }
            
            // Validate projects
            const projects = data.projects.map(projectData => {
                const project = Project.fromJSON(projectData);
                const validation = project.validate();
                if (!validation.isValid) {
                    throw new Error(`Invalid project data: ${validation.errors.join(', ')}`);
                }
                return project.toJSON();
            });
            
            // Save data
            Storage.saveProjects(projects);
            
            if (data.activeProjectId) {
                Storage.setActiveProjectId(data.activeProjectId);
            }
            
            if (data.theme) {
                Storage.setTheme(data.theme);
            }
            
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
}