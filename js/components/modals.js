// Modal Management
class ModalManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAccessibility();
    }

    bindEvents() {
        // Close modals when clicking outside or on close button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
            
            if (e.target.matches('[data-modal]')) {
                const modalId = e.target.dataset.modal;
                const modal = document.getElementById(modalId);
                if (modal) {
                    this.closeModal(modal);
                }
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });

        // Form submissions
        this.bindFormSubmissions();
    }

    bindFormSubmissions() {
        // Project form
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Handled by navigation component
            });
        }

        // Step form
        const stepForm = document.getElementById('step-form');
        if (stepForm) {
            stepForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Handled by project manager
            });
        }
    }

    setupAccessibility() {
        // Trap focus within modals
        document.addEventListener('keydown', (e) => {
            const openModal = document.querySelector('.modal.show');
            if (openModal && e.key === 'Tab') {
                this.trapFocus(e, openModal);
            }
        });
    }

    trapFocus(e, modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus on first focusable element
        const firstFocusable = modal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }

        // Store previous focus
        modal.dataset.previousFocus = document.activeElement.id || '';
    }

    closeModal(modal) {
        if (!modal) return;

        modal.classList.remove('show');
        document.body.style.overflow = '';

        // Restore previous focus
        const previousFocusId = modal.dataset.previousFocus;
        if (previousFocusId) {
            const previousElement = document.getElementById(previousFocusId);
            if (previousElement) {
                previousElement.focus();
            }
        }

        // Clear any form data
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => {
            // Don't reset if form is currently being submitted
            if (!form.classList.contains('submitting')) {
                form.reset();
            }
        });
    }

    closeAllModals() {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => this.closeModal(modal));
    }

    // Confirmation modal
    showConfirmModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(title, message, confirmText, cancelText);
            document.body.appendChild(modal);
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            const cleanup = () => {
                this.closeModal(modal);
                setTimeout(() => modal.remove(), 300);
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            // Focus on cancel button by default
            setTimeout(() => cancelBtn.focus(), 100);
        });
    }

    createConfirmModal(title, message, confirmText, cancelText) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${Helpers.escapeHtml(title)}</h3>
                </div>
                <div class="modal-body" style="padding: 0 1.5rem;">
                    <p style="margin-bottom: 1.5rem; line-height: 1.6;">${Helpers.escapeHtml(message)}</p>
                </div>
                <div class="form-actions" style="padding: 0 1.5rem 1.5rem;">
                    <button type="button" class="btn btn-secondary cancel-btn">${Helpers.escapeHtml(cancelText)}</button>
                    <button type="button" class="btn btn-danger confirm-btn">${Helpers.escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;
        return modal;
    }

    // Comment modal
    showCommentModal(fieldRef, comments = [], callbacks = {}) {
        const modal = this.createCommentModal(fieldRef, comments, callbacks);
        document.body.appendChild(modal);
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus on first input
        const firstInput = modal.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        return modal;
    }

    createCommentModal(fieldRef, comments, callbacks) {
        const modal = document.createElement('div');
        modal.className = 'modal comment-modal';
        modal.setAttribute('data-field-ref', fieldRef);
        
        const fieldDisplayName = this.getFieldDisplayName(fieldRef);
        const commentsHtml = this.renderCommentThread(comments, callbacks);
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i data-lucide="message-circle"></i> Comments: ${Helpers.escapeHtml(fieldDisplayName)}</h3>
                    <button type="button" class="modal-close" data-modal="close">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body comment-modal-body">
                    <div class="comment-thread">
                        ${commentsHtml}
                    </div>
                    
                    <div class="add-comment-section">
                        <h4>Add New Comment</h4>
                        <form class="comment-form" data-action="add">
                            <div class="form-group">
                                <label for="comment-author">Your Name:</label>
                                <input type="text" id="comment-author" name="authorName" required 
                                       placeholder="Enter your name" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="comment-content">Comment:</label>
                                <textarea id="comment-content" name="content" required 
                                         placeholder="Enter your comment..." class="form-control" rows="3"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" data-modal="close">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Comment</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Initialize Lucide icons
        setTimeout(() => lucide.createIcons(), 10);

        // Bind comment-specific events
        this.bindCommentModalEvents(modal, callbacks);
        
        return modal;
    }

    renderCommentThread(comments, callbacks) {
        if (!comments || comments.length === 0) {
            return '<div class="no-comments"><p>No comments yet. Be the first to add one!</p></div>';
        }

        return comments.map(comment => this.renderComment(comment, callbacks)).join('');
    }

    renderComment(comment, callbacks, isReply = false) {
        const timeAgo = this.getTimeAgo(comment.createdAt);
        const replyClass = isReply ? 'comment-reply' : 'comment-main';
        const resolvedClass = comment.isResolved ? 'comment-resolved' : '';
        const repliesHtml = comment.replies && comment.replies.length > 0 
            ? comment.replies.map(reply => this.renderComment(reply, callbacks, true)).join('')
            : '';

        return `
            <div class="comment ${replyClass} ${resolvedClass}" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <strong>${Helpers.escapeHtml(comment.authorName)}</strong>
                        <span class="comment-date">${timeAgo}</span>
                        ${comment.isResolved ? '<span class="resolved-badge">Resolved</span>' : ''}
                    </div>
                    <div class="comment-actions">
                        ${!isReply ? `
                            <button type="button" class="btn-icon reply-btn" title="Reply">
                                <i data-lucide="reply"></i>
                            </button>
                            <button type="button" class="btn-icon resolve-btn" 
                                    title="${comment.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}">
                                <i data-lucide="${comment.isResolved ? 'x-circle' : 'check-circle'}"></i>
                            </button>
                        ` : ''}
                        <button type="button" class="btn-icon edit-btn" title="Edit">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button type="button" class="btn-icon delete-btn" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="comment-content">
                    <div class="comment-text">${Helpers.escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
                </div>
                ${repliesHtml ? `<div class="comment-replies">${repliesHtml}</div>` : ''}
                <div class="reply-form-container" style="display: none;"></div>
            </div>
        `;
    }

    bindCommentModalEvents(modal, callbacks) {
        // Add comment form submission
        const commentForm = modal.querySelector('.comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const commentData = {
                    authorName: formData.get('authorName'),
                    content: formData.get('content')
                };

                try {
                    e.target.classList.add('submitting');
                    await callbacks.onAddComment?.(commentData);
                    e.target.reset();
                    this.closeModal(modal);
                    setTimeout(() => modal.remove(), 300);
                } catch (error) {
                    console.error('Error adding comment:', error);
                } finally {
                    e.target.classList.remove('submitting');
                }
            });
        }

        // Comment action buttons
        modal.addEventListener('click', async (e) => {
            const comment = e.target.closest('.comment');
            if (!comment) return;

            const commentId = comment.getAttribute('data-comment-id');

            // Reply button
            if (e.target.closest('.reply-btn')) {
                this.showReplyForm(comment, callbacks);
            }

            // Resolve button
            else if (e.target.closest('.resolve-btn')) {
                const isResolved = comment.classList.contains('comment-resolved');
                try {
                    await callbacks.onResolveComment?.(commentId, !isResolved);
                    this.closeModal(modal);
                    setTimeout(() => modal.remove(), 300);
                } catch (error) {
                    console.error('Error resolving comment:', error);
                }
            }

            // Edit button
            else if (e.target.closest('.edit-btn')) {
                this.showEditForm(comment, callbacks);
            }

            // Delete button
            else if (e.target.closest('.delete-btn')) {
                const confirmed = await this.showConfirmModal(
                    'Delete Comment',
                    'Are you sure you want to delete this comment? This action cannot be undone.',
                    'Delete',
                    'Cancel'
                );

                if (confirmed) {
                    try {
                        await callbacks.onDeleteComment?.(commentId);
                        this.closeModal(modal);
                        setTimeout(() => modal.remove(), 300);
                    } catch (error) {
                        console.error('Error deleting comment:', error);
                    }
                }
            }
        });
    }

    showReplyForm(comment, callbacks) {
        const container = comment.querySelector('.reply-form-container');
        if (container.style.display === 'block') {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <form class="reply-form">
                <div class="form-group">
                    <label>Your Name:</label>
                    <input type="text" name="authorName" required placeholder="Enter your name" class="form-control">
                </div>
                <div class="form-group">
                    <label>Reply:</label>
                    <textarea name="content" required placeholder="Enter your reply..." class="form-control" rows="2"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-reply">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Reply</button>
                </div>
            </form>
        `;

        container.style.display = 'block';

        // Focus first input
        const firstInput = container.querySelector('input');
        if (firstInput) firstInput.focus();

        // Handle form submission
        const form = container.querySelector('.reply-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const replyData = {
                authorName: formData.get('authorName'),
                content: formData.get('content')
            };

            try {
                const commentId = comment.getAttribute('data-comment-id');
                await callbacks.onAddReply?.(commentId, replyData);
                container.style.display = 'none';
                
                // Close and refresh modal
                const modal = comment.closest('.modal');
                this.closeModal(modal);
                setTimeout(() => modal.remove(), 300);
            } catch (error) {
                console.error('Error adding reply:', error);
            }
        });

        // Handle cancel
        const cancelBtn = container.querySelector('.cancel-reply');
        cancelBtn.addEventListener('click', () => {
            container.style.display = 'none';
        });
    }

    showEditForm(comment, callbacks) {
        const contentDiv = comment.querySelector('.comment-text');
        const originalContent = contentDiv.textContent;

        const editForm = document.createElement('div');
        editForm.className = 'edit-comment-form';
        editForm.innerHTML = `
            <form>
                <textarea class="form-control" rows="3">${Helpers.escapeHtml(originalContent)}</textarea>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-edit">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;

        contentDiv.style.display = 'none';
        contentDiv.parentNode.appendChild(editForm);

        // Focus textarea
        const textarea = editForm.querySelector('textarea');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);

        // Handle form submission
        const form = editForm.querySelector('form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newContent = textarea.value.trim();
            
            if (!newContent) return;

            try {
                const commentId = comment.getAttribute('data-comment-id');
                await callbacks.onEditComment?.(commentId, { content: newContent });
                
                // Close and refresh modal
                const modal = comment.closest('.modal');
                this.closeModal(modal);
                setTimeout(() => modal.remove(), 300);
            } catch (error) {
                console.error('Error editing comment:', error);
            }
        });

        // Handle cancel
        const cancelBtn = editForm.querySelector('.cancel-edit');
        cancelBtn.addEventListener('click', () => {
            contentDiv.style.display = 'block';
            editForm.remove();
        });
    }

    getFieldDisplayName(fieldRef) {
        const fieldMap = {
            'name': 'Project Name',
            'description': 'Description',
            'businessLead': 'Business Lead',
            'initiator': 'Initiator',
            'devTeamLead': 'Dev Team Lead',
            'projectStartDate': 'Project Start Date',
            'currentProjectStage': 'Current Project Stage',
            'currentAiStage': 'Current AI Stage',
            'targetNextStageDate': 'Target Next Stage Date',
            'targetCompletionDate': 'Target Completion Date',
            'budget': 'Budget',
            'keyRisks': 'Key Risks/Issues',
            'keyUpdates': 'Key Updates',
            'benefits.fteSavings.applicable': 'Benefits: FTE Savings (Applicable)',
            'benefits.fteSavings.details': 'Benefits: FTE Savings (Details)',
            'benefits.costSavings.applicable': 'Benefits: Cost Savings (Applicable)',
            'benefits.costSavings.details': 'Benefits: Cost Savings (Details)',
            'benefits.programIntegrity.applicable': 'Benefits: Program Integrity (Applicable)',
            'benefits.programIntegrity.details': 'Benefits: Program Integrity (Details)',
            'benefits.clientService.applicable': 'Benefits: Client Service (Applicable)',
            'benefits.clientService.details': 'Benefits: Client Service (Details)',
            'benefits.other.applicable': 'Benefits: Other (Applicable)',
            'benefits.other.details': 'Benefits: Other (Details)'
        };

        // Handle next steps dynamically
        if (fieldRef.startsWith('nextSteps.')) {
            const parts = fieldRef.split('.');
            const stepId = parts[1];
            const field = parts[2];
            const fieldNames = {
                'description': 'Description',
                'owner': 'Owner',
                'dueDate': 'Due Date',
                'status': 'Status'
            };
            return `Next Step ${stepId}: ${fieldNames[field] || field}`;
        }

        return fieldMap[fieldRef] || fieldRef;
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    // Loading modal
    showLoadingModal(message = 'Loading...') {
        const existingModal = document.getElementById('loading-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'loading-modal';
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 300px; text-align: center;">
                <div class="loading">
                    <i data-lucide="loader-2"></i>
                    <span>${Helpers.escapeHtml(message)}</span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Initialize lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        return modal;
    }

    hideLoadingModal() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            this.closeModal(modal);
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Alert modal
    showAlert(title, message, type = 'info') {
        return new Promise((resolve) => {
            const modal = this.createAlertModal(title, message, type);
            document.body.appendChild(modal);
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            const okBtn = modal.querySelector('.ok-btn');
            
            const cleanup = () => {
                this.closeModal(modal);
                setTimeout(() => modal.remove(), 300);
                resolve();
            };

            okBtn.addEventListener('click', cleanup);

            // Focus on OK button
            setTimeout(() => okBtn.focus(), 100);
        });
    }

    createAlertModal(title, message, type) {
        const iconMap = {
            info: 'info',
            success: 'check-circle',
            warning: 'alert-triangle',
            error: 'x-circle'
        };

        const colorMap = {
            info: 'var(--info-color)',
            success: 'var(--success-color)',
            warning: 'var(--warning-color)',
            error: 'var(--error-color)'
        };

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="${iconMap[type]}" style="color: ${colorMap[type]};"></i>
                        ${Helpers.escapeHtml(title)}
                    </h3>
                </div>
                <div class="modal-body" style="padding: 0 1.5rem;">
                    <p style="margin-bottom: 1.5rem; line-height: 1.6;">${Helpers.escapeHtml(message)}</p>
                </div>
                <div class="form-actions" style="padding: 0 1.5rem 1.5rem;">
                    <button type="button" class="btn btn-primary ok-btn">OK</button>
                </div>
            </div>
        `;

        // Initialize lucide icons
        setTimeout(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
        }, 0);

        return modal;
    }

    // Input prompt modal
    showPrompt(title, message, defaultValue = '', inputType = 'text') {
        return new Promise((resolve) => {
            const modal = this.createPromptModal(title, message, defaultValue, inputType);
            document.body.appendChild(modal);
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            const input = modal.querySelector('.prompt-input');
            const okBtn = modal.querySelector('.ok-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            const cleanup = () => {
                this.closeModal(modal);
                setTimeout(() => modal.remove(), 300);
            };

            okBtn.addEventListener('click', () => {
                const value = input.value.trim();
                cleanup();
                resolve(value || null);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            // Handle enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    okBtn.click();
                }
            });

            // Focus on input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        });
    }

    createPromptModal(title, message, defaultValue, inputType) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${Helpers.escapeHtml(title)}</h3>
                </div>
                <div class="modal-body" style="padding: 0 1.5rem;">
                    <p style="margin-bottom: 1rem; line-height: 1.6;">${Helpers.escapeHtml(message)}</p>
                    <input type="${inputType}" class="prompt-input" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-primary); color: var(--text-primary);" value="${Helpers.escapeHtml(defaultValue)}">
                </div>
                <div class="form-actions" style="padding: 1.5rem 1.5rem 1.5rem;">
                    <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                    <button type="button" class="btn btn-primary ok-btn">OK</button>
                </div>
            </div>
        `;
        return modal;
    }

    // File picker modal
    showFilePicker(accept = '*', multiple = false) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.multiple = multiple;
            input.style.display = 'none';

            input.addEventListener('change', (e) => {
                const files = e.target.files;
                resolve(multiple ? Array.from(files) : files[0] || null);
                input.remove();
            });

            // Handle cancel (when file dialog is closed without selecting)
            input.addEventListener('cancel', () => {
                resolve(null);
                input.remove();
            });

            document.body.appendChild(input);
            input.click();
        });
    }

    // Keyboard shortcuts help modal
    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + N', description: 'Create new project' },
            { key: 'Ctrl/Cmd + S', description: 'Save current project' },
            { key: 'Ctrl/Cmd + P', description: 'Print current project' },
            { key: 'Ctrl/Cmd + E', description: 'Export current project' },
            { key: 'Ctrl/Cmd + T', description: 'Toggle theme' },
            { key: 'Ctrl/Cmd + 1-9', description: 'Switch to project tab' },
            { key: 'Ctrl/Cmd + W', description: 'Close current project' },
            { key: 'Escape', description: 'Close modal or cancel action' },
            { key: 'Tab / Shift+Tab', description: 'Navigate between elements' }
        ];

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>
                        <i data-lucide="keyboard" style="margin-right: 0.5rem;"></i>
                        Keyboard Shortcuts
                    </h3>
                    <button class="modal-close" onclick="this.closest('.modal').classList.remove('show'); document.body.style.overflow = ''; setTimeout(() => this.closest('.modal').remove(), 300);">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 0 1.5rem 1.5rem;">
                    <div style="display: grid; gap: 0.75rem;">
                        ${shortcuts.map(shortcut => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                                <span style="color: var(--text-primary);">${Helpers.escapeHtml(shortcut.description)}</span>
                                <code style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem; color: var(--text-primary);">${Helpers.escapeHtml(shortcut.key)}</code>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Initialize lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        return modal;
    }
}