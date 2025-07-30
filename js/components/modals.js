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