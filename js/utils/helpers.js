// Helper Functions
class Helpers {
    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Calculate reporting period (mid-month to mid-month)
    static calculateReportingPeriod(date = new Date()) {
        const currentDate = new Date(date);
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const currentDay = currentDate.getDate();

        let startMonth, startYear, endMonth, endYear;

        if (currentDay >= 15) {
            // If after 15th, period is current month 15th to next month 15th
            startMonth = currentMonth;
            startYear = currentYear;
            endMonth = currentMonth + 1;
            endYear = currentYear;

            // Handle year wrap
            if (endMonth > 11) {
                endMonth = 0;
                endYear++;
            }
        } else {
            // If before 15th, period is previous month 15th to current month 15th
            startMonth = currentMonth - 1;
            startYear = currentYear;
            endMonth = currentMonth;
            endYear = currentYear;

            // Handle year wrap
            if (startMonth < 0) {
                startMonth = 11;
                startYear--;
            }
        }

        const startDate = new Date(startYear, startMonth, 15);
        const endDate = new Date(endYear, endMonth, 15);

        return {
            startDate,
            endDate,
            periodName: this.formatMonth(endMonth, endYear),
            periodString: `${this.formatDateShort(startDate)} - ${this.formatDateShort(endDate)}`
        };
    }

    // Format month name
    static formatMonth(month, year) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[month]} ${year}`;
    }

    // Format date for display
    static formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format date short
    static formatDateShort(date) {
        if (!date) return '';
        const d = new Date(date);
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }

    // Format date for input
    static formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Parse bullet points from text
    static parseBulletPoints(text) {
        if (!text) return [];
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.startsWith('•') ? line.substring(1).trim() : line);
    }

    // Format text as bullet points
    static formatAsBulletPoints(items) {
        if (!items || !Array.isArray(items)) return '';
        return items
            .filter(item => item && item.trim().length > 0)
            .map(item => `• ${item.trim()}`)
            .join('\n');
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Escape HTML
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Show toast notification
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        toast.innerHTML = `
            <i data-lucide="${iconMap[type] || 'info'}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Initialize lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
        
        return toast;
    }

    // Create toast container
    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 1100;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        `;
        document.body.appendChild(container);
        return container;
    }

    // Confirm dialog
    static confirm(message, title = 'Confirm') {
        return window.confirm(`${title}\n\n${message}`);
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success');
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Slugify text
    static slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
}