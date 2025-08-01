// Helper Functions - TypeScript version matching original helpers.js
export class Helpers {
    // Generate unique ID
    static generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Calculate reporting period (mid-month to mid-month)
    static calculateReportingPeriod(date: Date = new Date()) {
        const currentDate = new Date(date);
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const currentDay = currentDate.getDate();

        let startMonth: number, startYear: number, endMonth: number, endYear: number;

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
    static formatMonth(month: number, year: number): string {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[month]} ${year}`;
    }

    // Format date for display
    static formatDate(date: Date | string | null): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format date short (matches original format for period display)
    static formatDateShort(date: Date | string | null): string {
        if (!date) return '';
        const d = new Date(date);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[d.getMonth()]} ${d.getDate()}`;
    }

    // Format date for input
    static formatDateForInput(date: Date | string | null): string {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Parse bullet points from text
    static parseBulletPoints(text: string): string[] {
        if (!text) return [];
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.startsWith('•') ? line.substring(1).trim() : line);
    }

    // Format text as bullet points
    static formatAsBulletPoints(items: string[]): string {
        if (!items || !Array.isArray(items)) return '';
        return items
            .filter(item => item && item.trim().length > 0)
            .map(item => `• ${item.trim()}`)
            .join('\n');
    }

    // Escape HTML
    static escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Debounce function
    static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: Parameters<T>) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Validate email
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Slugify text
    static slugify(text: string): string {
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