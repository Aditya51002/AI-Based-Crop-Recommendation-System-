/**
 * Notification Service
 * Handles user notifications, toasts, and alerts
 */

class NotificationService {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    // Create notification container
    createContainer() {
        if (document.querySelector('.notification-container')) {
            this.container = document.querySelector('.notification-container');
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    // Show success notification
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    // Show error notification
    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    // Show warning notification
    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    // Show info notification
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    // Show generic notification
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: { bg: 'rgba(34, 197, 94, 0.9)', border: '#22c55e' },
            error: { bg: 'rgba(239, 68, 68, 0.9)', border: '#ef4444' },
            warning: { bg: 'rgba(245, 158, 11, 0.9)', border: '#f59e0b' },
            info: { bg: 'rgba(59, 130, 246, 0.9)', border: '#3b82f6' }
        };

        notification.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: ${colors[type].bg};
            color: white;
            padding: 1rem 1.25rem;
            border-radius: 0.75rem;
            border: 1px solid ${colors[type].border};
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            margin-bottom: 0.75rem;
            min-width: 300px;
            max-width: 400px;
            pointer-events: auto;
            transform: translateX(100%);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;

        notification.innerHTML = `
            <span style="font-size: 1.25rem;">${icons[type]}</span>
            <span style="flex: 1; font-weight: 500;">${message}</span>
            <button class="notification-close" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0;
                margin: 0;
                opacity: 0.7;
                transition: opacity 0.2s;
            ">×</button>
        `;

        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.opacity = '1';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.opacity = '0.7';
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    // Remove notification
    remove(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Clear all notifications
    clear() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => this.remove(notification));
    }

    // Show loading notification
    loading(message) {
        const notification = this.show(
            `<div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 2px solid white; animation: spin 1s linear infinite;"></div>
                ${message}
            </div>`,
            'info',
            0 // Don't auto-remove
        );

        // Add CSS animation for spinner
        if (!document.querySelector('#spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return notification;
    }

    // Confirm dialog
    confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 20000;
                backdrop-filter: blur(5px);
            `;

            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 1rem;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                ">
                    <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.25rem;">${title}</h3>
                    <p style="margin: 0 0 2rem 0; color: #6b7280; line-height: 1.5;">${message}</p>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="cancel-btn" style="
                            padding: 0.5rem 1.5rem;
                            border: 1px solid #d1d5db;
                            background: white;
                            color: #374151;
                            border-radius: 0.5rem;
                            cursor: pointer;
                        ">Cancel</button>
                        <button class="confirm-btn" style="
                            padding: 0.5rem 1.5rem;
                            border: none;
                            background: #ef4444;
                            color: white;
                            border-radius: 0.5rem;
                            cursor: pointer;
                        ">Confirm</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            // Click outside to cancel
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });
        });
    }
}

// Create and export singleton instance
window.notificationService = new NotificationService();