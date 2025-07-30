// Project Management Functions
class ProjectManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // Global step management functions
        window.editStep = (projectId, stepId) => this.editStep(projectId, stepId);
        window.deleteStep = (projectId, stepId) => this.deleteStep(projectId, stepId);
        window.showAddStepModal = (projectId) => this.showAddStepModal(projectId);
        
        // Auto-format bullet points
        this.initBulletPointFormatting();
    }

    initBulletPointFormatting() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('.risks-content, .updates-content')) {
                this.debouncedFormatBulletPoints(e.target);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.matches('.risks-content, .updates-content')) {
                this.handleBulletPointKeys(e);
            }
        });

        // Debounced version to avoid excessive formatting
        this.debouncedFormatBulletPoints = Helpers.debounce((textarea) => {
            this.formatBulletPoints(textarea);
        }, 500);
    }

    handleBulletPointKeys(e) {
        const textarea = e.target;
        
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const cursorPosition = textarea.selectionStart;
            const value = textarea.value;
            const beforeCursor = value.substring(0, cursorPosition);
            const afterCursor = value.substring(cursorPosition);
            
            // Add new bullet point
            const newValue = beforeCursor + '\n• ' + afterCursor;
            textarea.value = newValue;
            
            // Position cursor after the bullet
            textarea.setSelectionRange(cursorPosition + 3, cursorPosition + 3);
            
            // Trigger save
            textarea.dispatchEvent(new Event('input'));
        }
    }

    formatBulletPoints(textarea) {
        const cursorPosition = textarea.selectionStart;
        const value = textarea.value;
        const lines = value.split('\n');
        
        let formattedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
                return `• ${trimmed}`;
            }
            return line;
        });

        // Clean up empty lines but keep structure
        formattedLines = formattedLines.filter((line, index) => {
            if (line.trim() === '') {
                // Only keep empty line if it's not at the end and not consecutive
                return index < formattedLines.length - 1 && 
                       formattedLines[index + 1] && 
                       formattedLines[index + 1].trim() !== '';
            }
            return true;
        });

        const newValue = formattedLines.join('\n');
        
        if (newValue !== value) {
            textarea.value = newValue;
            
            // Try to maintain cursor position
            const diff = newValue.length - value.length;
            const newPosition = Math.max(0, Math.min(cursorPosition + diff, newValue.length));
            textarea.setSelectionRange(newPosition, newPosition);
        }
    }

    showAddStepModal(projectId) {
        const modal = document.getElementById('step-modal');
        const form = document.getElementById('step-form');
        const title = document.getElementById('step-modal-title');
        
        if (!modal || !form || !title) return;

        // Reset form and set title
        form.reset();
        title.textContent = 'Add Next Step';
        
        // Show modal
        modal.classList.add('show');

        // Focus on description
        const descriptionField = document.getElementById('step-description');
        if (descriptionField) {
            setTimeout(() => descriptionField.focus(), 100);
        }

        // Handle form submission
        const submitHandler = (e) => {
            e.preventDefault();
            this.saveStep(projectId, null, form);
            form.removeEventListener('submit', submitHandler);
        };

        form.addEventListener('submit', submitHandler);
    }

    editStep(projectId, stepId) {
        const project = DataManager.getProject(projectId);
        if (!project) return;

        const step = project.nextSteps.find(s => s.id === stepId);
        if (!step) return;

        const modal = document.getElementById('step-modal');
        const form = document.getElementById('step-form');
        const title = document.getElementById('step-modal-title');
        
        if (!modal || !form || !title) return;

        // Set title
        title.textContent = 'Edit Next Step';

        // Populate form
        document.getElementById('step-description').value = step.description || '';
        document.getElementById('step-owner').value = step.owner || '';
        document.getElementById('step-due-date').value = step.dueDate ? Helpers.formatDateForInput(step.dueDate) : '';
        document.getElementById('step-status').value = step.status || 'not-started';

        // Show modal
        modal.classList.add('show');

        // Focus on description
        setTimeout(() => document.getElementById('step-description').focus(), 100);

        // Handle form submission
        const submitHandler = (e) => {
            e.preventDefault();
            this.saveStep(projectId, stepId, form);
            form.removeEventListener('submit', submitHandler);
        };

        form.addEventListener('submit', submitHandler);
    }

    saveStep(projectId, stepId, form) {
        const stepData = {
            description: document.getElementById('step-description').value?.trim(),
            owner: document.getElementById('step-owner').value?.trim(),
            dueDate: document.getElementById('step-due-date').value,
            status: document.getElementById('step-status').value
        };

        // Validation
        if (!stepData.description) {
            Helpers.showToast('Description is required', 'error');
            document.getElementById('step-description').focus();
            return;
        }

        if (!stepData.owner) {
            Helpers.showToast('Owner is required', 'error');
            document.getElementById('step-owner').focus();
            return;
        }

        try {
            if (stepId) {
                // Update existing step
                DataManager.updateNextStep(projectId, stepId, stepData);
                Helpers.showToast('Step updated successfully', 'success');
            } else {
                // Add new step
                DataManager.addNextStep(projectId, stepData);
                Helpers.showToast('Step added successfully', 'success');
            }

            // Close modal
            const modal = document.getElementById('step-modal');
            modal.classList.remove('show');

            // Refresh the project page
            this.refreshProjectPage(projectId);

        } catch (error) {
            console.error('Error saving step:', error);
            Helpers.showToast('Failed to save step', 'error');
        }
    }

    deleteStep(projectId, stepId) {
        if (!Helpers.confirm('Are you sure you want to delete this step?', 'Delete Step')) {
            return;
        }

        try {
            DataManager.deleteNextStep(projectId, stepId);
            this.refreshProjectPage(projectId);
            Helpers.showToast('Step deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting step:', error);
            Helpers.showToast('Failed to delete step', 'error');
        }
    }

    refreshProjectPage(projectId) {
        const project = DataManager.getProject(projectId);
        if (!project) return;

        const projectPage = document.getElementById(`project-page-${projectId}`);
        if (!projectPage) return;

        // Refresh next steps table
        const tbody = projectPage.querySelector('#steps-tbody');
        if (!tbody) return;

        tbody.innerHTML = project.nextSteps.map((step, index) => {
            const stepObj = NextStep.fromJSON(step);
            const statusInfo = stepObj.getStatusInfo();
            
            return `
                <tr data-step-id="${step.id}">
                    <td>${index + 1}</td>
                    <td>${Helpers.escapeHtml(step.description)}</td>
                    <td>${Helpers.escapeHtml(step.owner)}</td>
                    <td>${step.dueDate ? Helpers.formatDate(step.dueDate) : ''}</td>
                    <td>
                        <span class="status-badge ${statusInfo.class}">
                            ${statusInfo.label}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="editStep('${projectId}', '${step.id}')" title="Edit">
                                <i data-lucide="edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteStep('${projectId}', '${step.id}')" title="Delete">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Re-initialize lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // Export project data
    exportProject(projectId) {
        const project = DataManager.getProject(projectId);
        if (!project) {
            Helpers.showToast('Project not found', 'error');
            return;
        }

        const exportData = {
            project: project.toJSON(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const filename = `${Helpers.slugify(project.name)}-export-${new Date().toISOString().split('T')[0]}.json`;

        this.downloadFile(dataStr, filename, 'application/json');
        Helpers.showToast('Project exported successfully', 'success');
    }

    // Import project data
    importProject(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (!importData.project) {
                    throw new Error('Invalid project file format');
                }

                const project = Project.fromJSON(importData.project);
                
                // Generate new ID to avoid conflicts
                project.id = Helpers.generateId();
                project.name = `${project.name} (Imported)`;
                project.createdAt = new Date().toISOString();
                project.updatedAt = new Date().toISOString();

                DataManager.saveProject(project);
                
                // Refresh navigation
                if (window.navigation) {
                    window.navigation.loadProjects();
                    window.navigation.switchToProject(project.id);
                }

                Helpers.showToast('Project imported successfully', 'success');

            } catch (error) {
                console.error('Import failed:', error);
                Helpers.showToast('Failed to import project: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }

    // Export all projects
    exportAllProjects() {
        try {
            const exportData = DataManager.exportData();
            const dataStr = JSON.stringify(exportData, null, 2);
            const filename = `monthly-updates-export-${new Date().toISOString().split('T')[0]}.json`;

            this.downloadFile(dataStr, filename, 'application/json');
            Helpers.showToast('All projects exported successfully', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            Helpers.showToast('Failed to export projects', 'error');
        }
    }

    // Import all projects
    importAllProjects(file) {
        if (!Helpers.confirm('This will replace all existing projects. Are you sure?', 'Import All Projects')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                DataManager.importData(importData);
                
                // Refresh the entire application
                if (window.navigation) {
                    window.navigation.loadProjects();
                }

                Helpers.showToast('All projects imported successfully', 'success');

            } catch (error) {
                console.error('Import failed:', error);
                Helpers.showToast('Failed to import projects: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }

    // Download file helper
    downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Print project report
    printProject(projectId) {
        const project = DataManager.getProject(projectId);
        if (!project) {
            Helpers.showToast('Project not found', 'error');
            return;
        }

        // Create print-friendly version
        const printWindow = window.open('', '_blank');
        const printContent = this.generatePrintContent(project);
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    }

    generatePrintContent(project) {
        const period = project.getReportingPeriod();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${project.name} - Monthly Update</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                    .header { border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 20px; }
                    .section { margin-bottom: 25px; }
                    .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                    .detail-item { margin-bottom: 10px; }
                    .detail-label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.8em; }
                    .bullet-points { margin: 10px 0; }
                    .bullet-points li { margin: 5px 0; }
                    @media print { body { margin: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${Helpers.escapeHtml(project.name)}</h1>
                    <p><strong>Reporting Period:</strong> ${period.periodString}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div class="section">
                    <h3>Project Description</h3>
                    <p>${Helpers.escapeHtml(project.description) || 'No description provided'}</p>
                </div>

                <div class="section">
                    <h3>Project Details</h3>
                    <div class="details-grid">
                        <div>
                            <div class="detail-item"><span class="detail-label">Business Lead:</span> ${Helpers.escapeHtml(project.businessLead)}</div>
                            <div class="detail-item"><span class="detail-label">Initiator:</span> ${Helpers.escapeHtml(project.initiator)}</div>
                            <div class="detail-item"><span class="detail-label">Dev Team Lead:</span> ${Helpers.escapeHtml(project.devTeamLead)}</div>
                            <div class="detail-item"><span class="detail-label">Project Start Date:</span> ${project.projectStartDate ? Helpers.formatDate(project.projectStartDate) : 'Not set'}</div>
                            <div class="detail-item"><span class="detail-label">Budget:</span> ${Helpers.escapeHtml(project.budget) || 'Not specified'}</div>
                        </div>
                        <div>
                            <div class="detail-item"><span class="detail-label">Current Project Stage:</span> ${Helpers.escapeHtml(project.currentProjectStage)}</div>
                            <div class="detail-item"><span class="detail-label">Current AI Stage:</span> ${Helpers.escapeHtml(project.currentAiStage)}</div>
                            <div class="detail-item"><span class="detail-label">Target Next Stage Date:</span> ${project.targetNextStageDate ? Helpers.formatDate(project.targetNextStageDate) : 'Not set'}</div>
                            <div class="detail-item"><span class="detail-label">Target Completion:</span> ${project.targetCompletionDate ? Helpers.formatDate(project.targetCompletionDate) : 'Not set'}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>Expected Benefits</h3>
                    <table>
                        <thead>
                            <tr><th>Defined Benefit</th><th>Applicable</th><th>Details</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>FTE Savings</td><td>${project.benefits.fteSavings?.applicable || ''}</td><td>${Helpers.escapeHtml(project.benefits.fteSavings?.details || '')}</td></tr>
                            <tr><td>Cost Avoidance / Cost Savings</td><td>${project.benefits.costSavings?.applicable || ''}</td><td>${Helpers.escapeHtml(project.benefits.costSavings?.details || '')}</td></tr>
                            <tr><td>Program Integrity</td><td>${project.benefits.programIntegrity?.applicable || ''}</td><td>${Helpers.escapeHtml(project.benefits.programIntegrity?.details || '')}</td></tr>
                            <tr><td>Client Service</td><td>${project.benefits.clientService?.applicable || ''}</td><td>${Helpers.escapeHtml(project.benefits.clientService?.details || '')}</td></tr>
                            <tr><td>Other</td><td>${project.benefits.other?.applicable || ''}</td><td>${Helpers.escapeHtml(project.benefits.other?.details || '')}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h3>Key Risks/Issues</h3>
                    <ul class="bullet-points">
                        ${Helpers.parseBulletPoints(project.keyRisks).map(risk => `<li>${Helpers.escapeHtml(risk)}</li>`).join('')}
                    </ul>
                </div>

                <div class="section">
                    <h3>Key Updates</h3>
                    <ul class="bullet-points">
                        ${Helpers.parseBulletPoints(project.keyUpdates).map(update => `<li>${Helpers.escapeHtml(update)}</li>`).join('')}
                    </ul>
                </div>

                <div class="section">
                    <h3>Next Steps</h3>
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Description</th><th>Owner</th><th>Due Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${project.nextSteps.map((step, index) => {
                                const stepObj = NextStep.fromJSON(step);
                                const statusInfo = stepObj.getStatusInfo();
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${Helpers.escapeHtml(step.description)}</td>
                                        <td>${Helpers.escapeHtml(step.owner)}</td>
                                        <td>${step.dueDate ? Helpers.formatDate(step.dueDate) : ''}</td>
                                        <td><span class="status-badge">${statusInfo.label}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;
    }

    // Search projects
    searchProjects(query) {
        if (!query || query.trim().length === 0) {
            return DataManager.getProjects();
        }

        const searchTerm = query.toLowerCase().trim();
        const projects = DataManager.getProjects();

        return projects.filter(project => {
            return project.name.toLowerCase().includes(searchTerm) ||
                   project.description.toLowerCase().includes(searchTerm) ||
                   project.businessLead.toLowerCase().includes(searchTerm) ||
                   project.keyUpdates.toLowerCase().includes(searchTerm) ||
                   project.nextSteps.some(step => 
                       step.description.toLowerCase().includes(searchTerm) ||
                       step.owner.toLowerCase().includes(searchTerm)
                   );
        });
    }

    // Get project statistics
    getProjectStats(projectId) {
        const project = DataManager.getProject(projectId);
        if (!project) return null;

        const steps = project.nextSteps.map(s => NextStep.fromJSON(s));
        const completedSteps = steps.filter(s => s.status === 'completed').length;
        const overdueSteps = steps.filter(s => s.isOverdue()).length;
        const dueSoonSteps = steps.filter(s => s.isDueSoon()).length;

        return {
            totalSteps: steps.length,
            completedSteps,
            overdueSteps,
            dueSoonSteps,
            completionRate: steps.length > 0 ? (completedSteps / steps.length * 100).toFixed(1) : 0,
            lastUpdated: project.updatedAt ? new Date(project.updatedAt) : null
        };
    }
}