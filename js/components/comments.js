/**
 * CommentManager - Handles all comment-related operations
 * Integrates with existing ModalManager and follows app patterns
 */
class CommentManager {
    constructor(app) {
        this.app = app;
        this.apiBase = 'http://localhost:3002/api';
        this.comments = new Map(); // Cache comments by field reference
        this.commentCounts = new Map(); // Cache comment counts by field
        this.currentProjectId = null;
        this.currentPeriodId = null;
        
        this.init();
    }

    async init() {
        this.createCommentIcons();
        this.setupEventListeners();
        await this.loadCurrentPeriod();
    }

    /**
     * Create sticky note icons next to form fields
     */
    createCommentIcons() {
        // Field mapping for comment icons
        const fieldMappings = [
            // Project details sidebar
            { selector: '[data-field="name"]', fieldRef: 'name' },
            { selector: '[data-field="description"]', fieldRef: 'description' },
            { selector: '[data-field="business-lead"]', fieldRef: 'businessLead' },
            { selector: '[data-field="initiator"]', fieldRef: 'initiator' },
            { selector: '[data-field="dev-team-lead"]', fieldRef: 'devTeamLead' },
            { selector: '[data-field="project-start-date"]', fieldRef: 'projectStartDate' },
            { selector: '[data-field="current-project-stage"]', fieldRef: 'currentProjectStage' },
            { selector: '[data-field="current-ai-stage"]', fieldRef: 'currentAiStage' },
            { selector: '[data-field="target-next-stage-date"]', fieldRef: 'targetNextStageDate' },
            { selector: '[data-field="target-completion-date"]', fieldRef: 'targetCompletionDate' },
            { selector: '[data-field="budget"]', fieldRef: 'budget' },
            
            // Benefits section
            { selector: '[data-benefit="fteSavings"] .benefit-applicable', fieldRef: 'benefits.fteSavings.applicable' },
            { selector: '[data-benefit="fteSavings"] .benefit-details', fieldRef: 'benefits.fteSavings.details' },
            { selector: '[data-benefit="costSavings"] .benefit-applicable', fieldRef: 'benefits.costSavings.applicable' },
            { selector: '[data-benefit="costSavings"] .benefit-details', fieldRef: 'benefits.costSavings.details' },
            { selector: '[data-benefit="programIntegrity"] .benefit-applicable', fieldRef: 'benefits.programIntegrity.applicable' },
            { selector: '[data-benefit="programIntegrity"] .benefit-details', fieldRef: 'benefits.programIntegrity.details' },
            { selector: '[data-benefit="clientService"] .benefit-applicable', fieldRef: 'benefits.clientService.applicable' },
            { selector: '[data-benefit="clientService"] .benefit-details', fieldRef: 'benefits.clientService.details' },
            { selector: '[data-benefit="other"] .benefit-applicable', fieldRef: 'benefits.other.applicable' },
            { selector: '[data-benefit="other"] .benefit-details', fieldRef: 'benefits.other.details' },
            
            // Content sections
            { selector: '.description-content', fieldRef: 'description' },
            { selector: '.risks-content', fieldRef: 'keyRisks' },
            { selector: '.updates-content', fieldRef: 'keyUpdates' }
        ];

        fieldMappings.forEach(mapping => {
            const elements = document.querySelectorAll(mapping.selector);
            elements.forEach(element => {
                this.addCommentIcon(element, mapping.fieldRef);
            });
        });

        // Add icons for next steps (dynamic)
        this.addNextStepsCommentIcons();
    }

    /**
     * Add comment icon to a specific element
     */
    addCommentIcon(element, fieldRef) {
        // Skip if icon already exists
        if (element.querySelector('.comment-icon')) return;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'comment-icon-container';
        
        const icon = document.createElement('button');
        icon.className = 'comment-icon';
        icon.innerHTML = '<i data-lucide="sticky-note"></i>';
        icon.setAttribute('data-field-ref', fieldRef);
        icon.setAttribute('title', 'Add or view comments');
        
        // Add comment count badge
        const badge = document.createElement('span');
        badge.className = 'comment-count-badge hidden';
        icon.appendChild(badge);
        
        iconContainer.appendChild(icon);
        
        // Position icon relative to element
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
            // For form inputs, add after the element
            element.parentNode.style.position = 'relative';
            element.parentNode.appendChild(iconContainer);
        } else {
            // For content areas, add inside
            element.style.position = 'relative';
            element.appendChild(iconContainer);
        }

        // Initialize Lucide icon
        lucide.createIcons();
        
        // Load comment count for this field
        this.updateCommentCount(fieldRef, icon);
    }

    /**
     * Add comment icons for next steps (dynamic content)
     */
    addNextStepsCommentIcons() {
        const nextStepsRows = document.querySelectorAll('.next-steps-table tbody tr');
        nextStepsRows.forEach((row, index) => {
            const stepId = row.getAttribute('data-step-id') || `step-${index}`;
            
            // Add icon to description cell
            const descCell = row.querySelector('.step-description');
            if (descCell) {
                this.addCommentIcon(descCell, `nextSteps.${stepId}.description`);
            }
            
            // Add icon to owner cell
            const ownerCell = row.querySelector('.step-owner');
            if (ownerCell) {
                this.addCommentIcon(ownerCell, `nextSteps.${stepId}.owner`);
            }
            
            // Add icon to due date cell
            const dueDateCell = row.querySelector('.step-due-date');
            if (dueDateCell) {
                this.addCommentIcon(dueDateCell, `nextSteps.${stepId}.dueDate`);
            }
            
            // Add icon to status cell
            const statusCell = row.querySelector('.step-status');
            if (statusCell) {
                this.addCommentIcon(statusCell, `nextSteps.${stepId}.status`);
            }
        });
    }

    /**
     * Setup event listeners for comment interactions
     */
    setupEventListeners() {
        // Comment icon clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-icon')) {
                e.preventDefault();
                e.stopPropagation();
                const icon = e.target.closest('.comment-icon');
                const fieldRef = icon.getAttribute('data-field-ref');
                this.openCommentModal(fieldRef);
            }
        });

        // Listen for project changes
        document.addEventListener('projectChanged', (e) => {
            this.currentProjectId = e.detail.projectId;
            this.refreshCommentCounts();
        });

        // Listen for period changes
        document.addEventListener('periodChanged', (e) => {
            this.currentPeriodId = e.detail.periodId;
            this.refreshCommentCounts();
        });

        // Listen for next steps updates to refresh icons
        document.addEventListener('nextStepsUpdated', () => {
            setTimeout(() => this.addNextStepsCommentIcons(), 100);
        });
    }

    /**
     * Open comment modal for a specific field
     */
    async openCommentModal(fieldRef) {
        if (!this.currentProjectId || !this.currentPeriodId) {
            this.app.showNotification('Please select a project and period first', 'warning');
            return;
        }

        try {
            const comments = await this.loadFieldComments(fieldRef);
            this.app.modalManager.showCommentModal(fieldRef, comments, {
                onAddComment: (commentData) => this.addComment(fieldRef, commentData),
                onEditComment: (commentId, commentData) => this.editComment(commentId, commentData),
                onDeleteComment: (commentId) => this.deleteComment(commentId),
                onResolveComment: (commentId, resolved) => this.resolveComment(commentId, resolved),
                onAddReply: (parentId, replyData) => this.addReply(parentId, replyData)
            });
        } catch (error) {
            console.error('Error opening comment modal:', error);
            this.app.showNotification('Failed to load comments', 'error');
        }
    }

    /**
     * Load comments for a specific field
     */
    async loadFieldComments(fieldRef) {
        const cacheKey = `${this.currentProjectId}-${this.currentPeriodId}-${fieldRef}`;
        
        if (this.comments.has(cacheKey)) {
            return this.comments.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.apiBase}/comments/field/${this.currentProjectId}/${this.currentPeriodId}/${encodeURIComponent(fieldRef)}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            const comments = result.data || [];
            
            // Cache the comments
            this.comments.set(cacheKey, comments);
            
            return comments;
        } catch (error) {
            console.error('Error loading field comments:', error);
            throw error;
        }
    }

    /**
     * Add a new comment
     */
    async addComment(fieldRef, commentData) {
        try {
            const payload = {
                projectId: this.currentProjectId,
                periodId: this.currentPeriodId,
                fieldReference: fieldRef,
                authorName: commentData.authorName,
                content: commentData.content,
                replies: commentData.replies || []
            };

            const response = await fetch(`${this.apiBase}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Clear cache and refresh
            this.clearFieldCache(fieldRef);
            await this.updateCommentCount(fieldRef);
            
            this.app.showNotification('Comment added successfully', 'success');
            return result.data;
        } catch (error) {
            console.error('Error adding comment:', error);
            this.app.showNotification('Failed to add comment', 'error');
            throw error;
        }
    }

    /**
     * Add a reply to existing comment
     */
    async addReply(parentId, replyData) {
        try {
            const payload = {
                authorName: replyData.authorName,
                content: replyData.content
            };

            const response = await fetch(`${this.apiBase}/comments/${parentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Clear cache and refresh counts
            this.comments.clear();
            await this.refreshCommentCounts();
            
            this.app.showNotification('Reply added successfully', 'success');
            return result.data;
        } catch (error) {
            console.error('Error adding reply:', error);
            this.app.showNotification('Failed to add reply', 'error');
            throw error;
        }
    }

    /**
     * Edit an existing comment
     */
    async editComment(commentId, commentData) {
        try {
            const response = await fetch(`${this.apiBase}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Clear cache
            this.comments.clear();
            
            this.app.showNotification('Comment updated successfully', 'success');
            return result.data;
        } catch (error) {
            console.error('Error editing comment:', error);
            this.app.showNotification('Failed to update comment', 'error');
            throw error;
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId) {
        try {
            const response = await fetch(`${this.apiBase}/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Clear cache and refresh counts
            this.comments.clear();
            await this.refreshCommentCounts();
            
            this.app.showNotification('Comment deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.app.showNotification('Failed to delete comment', 'error');
            throw error;
        }
    }

    /**
     * Resolve/unresolve a comment
     */
    async resolveComment(commentId, resolved) {
        try {
            const payload = {
                isResolved: resolved,
                resolvedBy: resolved ? 'Current User' : null
            };

            const response = await fetch(`${this.apiBase}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Clear cache
            this.comments.clear();
            
            const action = resolved ? 'resolved' : 'reopened';
            this.app.showNotification(`Comment ${action} successfully`, 'success');
        } catch (error) {
            console.error('Error resolving comment:', error);
            this.app.showNotification('Failed to update comment status', 'error');
            throw error;
        }
    }

    /**
     * Update comment count badge for a field
     */
    async updateCommentCount(fieldRef, iconElement = null) {
        try {
            if (!this.currentProjectId || !this.currentPeriodId) return;

            const comments = await this.loadFieldComments(fieldRef);
            const count = this.countAllComments(comments);
            
            // Update cache
            this.commentCounts.set(fieldRef, count);
            
            // Update UI
            const icon = iconElement || document.querySelector(`[data-field-ref="${fieldRef}"]`);
            if (icon) {
                const badge = icon.querySelector('.comment-count-badge');
                if (badge) {
                    if (count > 0) {
                        badge.textContent = count;
                        badge.classList.remove('hidden');
                        icon.classList.add('has-comments');
                    } else {
                        badge.classList.add('hidden');
                        icon.classList.remove('has-comments');
                    }
                }
            }
        } catch (error) {
            console.error('Error updating comment count:', error);
        }
    }

    /**
     * Count all comments including replies
     */
    countAllComments(comments) {
        let count = 0;
        comments.forEach(comment => {
            count++; // Main comment
            if (comment.replies && comment.replies.length > 0) {
                count += comment.replies.length; // Replies
            }
        });
        return count;
    }

    /**
     * Load current reporting period
     */
    async loadCurrentPeriod() {
        try {
            if (!this.currentProjectId) return;

            const response = await fetch(`${this.apiBase}/periods/current/${this.currentProjectId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.currentPeriodId = result.data.id;
            
            // Trigger period change event
            document.dispatchEvent(new CustomEvent('periodChanged', {
                detail: { periodId: this.currentPeriodId }
            }));
        } catch (error) {
            console.error('Error loading current period:', error);
        }
    }

    /**
     * Refresh all comment counts
     */
    async refreshCommentCounts() {
        if (!this.currentProjectId || !this.currentPeriodId) return;

        const icons = document.querySelectorAll('.comment-icon[data-field-ref]');
        for (const icon of icons) {
            const fieldRef = icon.getAttribute('data-field-ref');
            await this.updateCommentCount(fieldRef, icon);
        }
    }

    /**
     * Clear cache for a specific field
     */
    clearFieldCache(fieldRef) {
        const cacheKey = `${this.currentProjectId}-${this.currentPeriodId}-${fieldRef}`;
        this.comments.delete(cacheKey);
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.comments.clear();
        this.commentCounts.clear();
    }

    /**
     * Set current project and period
     */
    setContext(projectId, periodId) {
        this.currentProjectId = projectId;
        this.currentPeriodId = periodId;
        this.clearCache();
        this.refreshCommentCounts();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommentManager;
}