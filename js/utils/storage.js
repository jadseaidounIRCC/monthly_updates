// Local Storage Utilities
class Storage {
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error getting from storage:', error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting to storage:', error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    static getProjects() {
        return this.get('monthly_updates_projects', []);
    }

    static saveProjects(projects) {
        return this.set('monthly_updates_projects', projects);
    }

    static getProject(projectId) {
        const projects = this.getProjects();
        return projects.find(p => p.id === projectId) || null;
    }

    static saveProject(project) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === project.id);
        
        if (index >= 0) {
            projects[index] = project;
        } else {
            projects.push(project);
        }
        
        return this.saveProjects(projects);
    }

    static deleteProject(projectId) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        return this.saveProjects(filteredProjects);
    }

    static getActiveProjectId() {
        return this.get('monthly_updates_active_project');
    }

    static setActiveProjectId(projectId) {
        return this.set('monthly_updates_active_project', projectId);
    }

    static getTheme() {
        return this.get('monthly_updates_theme', 'theme-dark');
    }

    static setTheme(theme) {
        return this.set('monthly_updates_theme', theme);
    }
}