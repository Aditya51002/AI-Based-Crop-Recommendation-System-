/**
 * AgriSmart Utility Functions
 * Common functions for the web application
 */

// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

const StorageManager = {
    // User data
    setUser: (user) => {
        localStorage.setItem('agrismart_user', JSON.stringify(user));
    },
    
    getUser: () => {
        const user = localStorage.getItem('agrismart_user');
        return user ? JSON.parse(user) : null;
    },
    
    removeUser: () => {
        localStorage.removeItem('agrismart_user');
    },
    
    // Auth token
    setToken: (token) => {
        localStorage.setItem('agrismart_token', token);
    },
    
    getToken: () => {
        return localStorage.getItem('agrismart_token');
    },
    
    removeToken: () => {
        localStorage.removeItem('agrismart_token');
    },
    
    // Complete logout - clears all user data
    logout: () => {
        localStorage.removeItem('agrismart_user');
        localStorage.removeItem('agrismart_token');
        localStorage.removeItem('agrismart_prefs');
        localStorage.removeItem('agrismart_history');
        console.log('User logged out - all data cleared');
    },
    
    // User preferences
    setPreference: (key, value) => {
        const prefs = JSON.parse(localStorage.getItem('agrismart_prefs') || '{}');
        prefs[key] = value;
        localStorage.setItem('agrismart_prefs', JSON.stringify(prefs));
    },
    
    getPreference: (key, defaultValue = null) => {
        const prefs = JSON.parse(localStorage.getItem('agrismart_prefs') || '{}');
        return prefs[key] !== undefined ? prefs[key] : defaultValue;
    },
    
    // History
    addHistory: (item) => {
        const history = JSON.parse(localStorage.getItem('agrismart_history') || '[]');
        const historyItem = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            ...item
        };
        history.push(historyItem);
        // Keep only last 100 items
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        localStorage.setItem('agrismart_history', JSON.stringify(history));
        return historyItem;
    },
    
    getHistory: () => {
        return JSON.parse(localStorage.getItem('agrismart_history') || '[]');
    },
    
    getHistoryByType: (type) => {
        const history = JSON.parse(localStorage.getItem('agrismart_history') || '[]');
        return history.filter(item => item.type === type);
    },
    
    clearHistory: () => {
        localStorage.removeItem('agrismart_history');
    },
    addToHistory: (item) => {
        const history = JSON.parse(localStorage.getItem('agrismart_history') || '[]');
        history.unshift({ ...item, timestamp: new Date().toISOString() });
        localStorage.setItem('agrismart_history', JSON.stringify(history.slice(0, 100))); // Keep last 100
    },
    
    getHistory: () => {
        return JSON.parse(localStorage.getItem('agrismart_history') || '[]');
    },
    
    clearHistory: () => {
        localStorage.removeItem('agrismart_history');
    }
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

const Validators = {
    // Email validation
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Phone validation (Indian format)
    isValidPhone: (phone) => {
        const re = /^(\+91|0)?[6-9]\d{9}$/;
        return re.test(phone.replace(/\s+/g, ''));
    },
    
    // Password strength
    getPasswordStrength: (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        return strength;
    },
    
    // Soil data validation
    isValidSoilData: (data) => {
        return (
            data.nitrogen !== undefined && data.nitrogen >= 0 && data.nitrogen <= 200 &&
            data.phosphorus !== undefined && data.phosphorus >= 0 && data.phosphorus <= 200 &&
            data.potassium !== undefined && data.potassium >= 0 && data.potassium <= 200 &&
            data.ph !== undefined && data.ph >= 3 && data.ph <= 10 &&
            data.humidity !== undefined && data.humidity >= 0 && data.humidity <= 100
        );
    }
};

// ============================================
// DATE & TIME UTILITIES
// ============================================

const DateUtils = {
    // Format date
    formatDate: (date, format = 'short') => {
        const d = new Date(date);
        const options = format === 'short' 
            ? { year: '2-digit', month: 'short', day: 'numeric' }
            : { year: 'numeric', month: 'long', day: 'numeric' };
        return d.toLocaleDateString('en-IN', options);
    },
    
    // Format time
    formatTime: (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    },
    
    // Format date and time
    formatDateTime: (date) => {
        return `${DateUtils.formatDate(date)} - ${DateUtils.formatTime(date)}`;
    },
    
    // Get relative time (e.g., "2 hours ago")
    getRelativeTime: (date) => {
        const d = new Date(date);
        const now = new Date();
        const seconds = Math.floor((now - d) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        
        return DateUtils.formatDate(date);
    },
    
    // Get day of week
    getDayOfWeek: (date) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(date).getDay()];
    }
};

// ============================================
// NUMBER & CURRENCY FORMATTING
// ============================================

const Formatters = {
    // Format currency (Indian format with ₹)
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },
    
    // Format large numbers with abbreviations
    formatNumber: (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    
    // Format percentage
    formatPercentage: (value, decimals = 1) => {
        return value.toFixed(decimals) + '%';
    },
    
    // Format yield (tonnes/hectare)
    formatYield: (value) => {
        return value.toFixed(2) + ' t/ha';
    }
};

// ============================================
// STRING UTILITIES
// ============================================

const StringUtils = {
    // Capitalize first letter
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    // Capitalize all words
    capitalizeAll: (str) => {
        return str.split(' ').map(word => StringUtils.capitalize(word)).join(' ');
    },
    
    // Truncate string
    truncate: (str, length = 50) => {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },
    
    // Remove extra spaces
    cleanSpaces: (str) => {
        return str.replace(/\s+/g, ' ').trim();
    },
    
    // Slug format
    toSlug: (str) => {
        return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }
};

// ============================================
// DOM UTILITIES
// ============================================

const DOMUtils = {
    // Get element
    getElement: (selector) => {
        return document.querySelector(selector);
    },
    
    // Get all elements
    getElements: (selector) => {
        return document.querySelectorAll(selector);
    },
    
    // Create element with classes and attributes
    createElement: (tag, className = '', attributes = {}) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        return element;
    },
    
    // Add event listener
    on: (selector, event, callback) => {
        const elements = DOMUtils.getElements(selector);
        elements.forEach(el => el.addEventListener(event, callback));
    },
    
    // Show element
    show: (selector) => {
        const element = DOMUtils.getElement(selector);
        if (element) element.style.display = 'block';
    },
    
    // Hide element
    hide: (selector) => {
        const element = DOMUtils.getElement(selector);
        if (element) element.style.display = 'none';
    },
    
    // Toggle class
    toggleClass: (selector, className) => {
        const element = DOMUtils.getElement(selector);
        if (element) element.classList.toggle(className);
    },
    
    // Add class
    addClass: (selector, className) => {
        const element = DOMUtils.getElement(selector);
        if (element) element.classList.add(className);
    },
    
    // Remove class
    removeClass: (selector, className) => {
        const element = DOMUtils.getElement(selector);
        if (element) element.classList.remove(className);
    }
};

// ============================================
// NOTIFICATION UTILITIES
// ============================================

const Notifications = {
    // Show toast notification
    toast: (message, type = 'success', duration = 3000) => {
        const toast = DOMUtils.createElement('div', `toast toast-${type}`, {
            role: 'alert'
        });
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    // Show alert modal
    alert: (title, message, type = 'info') => {
        const modal = DOMUtils.createElement('div', 'modal-alert', {
            role: 'dialog'
        });
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // Show confirm dialog
    confirm: (title, message, onConfirm, onCancel) => {
        const modal = DOMUtils.createElement('div', 'modal-confirm', {
            role: 'dialog'
        });
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button class="btn btn-primary" id="confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('confirm-btn').onclick = () => {
            if (onConfirm) onConfirm();
            modal.remove();
        };
        
        document.getElementById('cancel-btn').onclick = () => {
            if (onCancel) onCancel();
            modal.remove();
        };
    }
};

// ============================================
// NETWORK UTILITIES
// ============================================

const NetworkUtils = {
    // Check internet connection
    isOnline: () => {
        return navigator.onLine;
    },
    
    // Wait for online
    waitForOnline: () => {
        return new Promise((resolve) => {
            if (NetworkUtils.isOnline()) {
                resolve();
            } else {
                window.addEventListener('online', resolve, { once: true });
            }
        });
    },
    
    // Parse API error
    parseError: (error) => {
        if (error.response) {
            return error.response.data?.message || 'Server error';
        } else if (error.request) {
            return 'No response from server';
        } else {
            return error.message || 'Unknown error';
        }
    }
};

// ============================================
// EXPORT
// ============================================

// ============================================
// ENHANCED INTERCONNECTION UTILITIES
// ============================================

// Navigation and Page Management
const Navigation = {
    // Check if user is authenticated
    requireAuth: () => {
        const user = StorageManager.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    // Update navigation state
    updateNavigation: () => {
        const user = StorageManager.getUser();
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userNameElements = document.querySelectorAll('.user-name');
        
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
                logoutBtn.onclick = () => {
                    StorageManager.removeUser();
                    StorageManager.removeToken();
                    window.location.href = 'login.html';
                };
            }
            userNameElements.forEach(el => {
                el.textContent = user.name || user.phone || 'User';
            });
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    },
    
    // Go to page with data
    goToPageWithData: (page, data) => {
        if (data) {
            sessionStorage.setItem('agrismart_page_data', JSON.stringify(data));
        }
        window.location.href = page;
    },
    
    // Get data passed to current page
    getPageData: () => {
        const data = sessionStorage.getItem('agrismart_page_data');
        if (data) {
            sessionStorage.removeItem('agrismart_page_data');
            return JSON.parse(data);
        }
        return null;
    }
};

// Cross-platform integration utilities
const CrossPlatform = {
    // Check if running in mobile app
    isMobileApp: () => {
        return window.AgriSmartMobile !== undefined;
    },
    
    // Send data to mobile app
    sendToMobile: (data) => {
        if (CrossPlatform.isMobileApp() && window.AgriSmartMobile.receiveWebData) {
            window.AgriSmartMobile.receiveWebData(JSON.stringify(data));
        }
    },
    
    // Sync data with mobile app
    syncWithMobile: () => {
        if (CrossPlatform.isMobileApp()) {
            const userData = StorageManager.getUser();
            const history = StorageManager.getHistory();
            CrossPlatform.sendToMobile({
                type: 'sync',
                user: userData,
                history: history
            });
        }
    }
};

// Enhanced form utilities
const FormUtils = {
    // Auto-save form data
    autoSave: (formId, key) => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Load saved data
        const saved = localStorage.getItem(`form_${key}`);
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(fieldName => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (field) field.value = data[fieldName];
            });
        }
        
        // Save on input
        form.addEventListener('input', () => {
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            localStorage.setItem(`form_${key}`, JSON.stringify(data));
        });
    },
    
    // Clear saved form data
    clearSaved: (key) => {
        localStorage.removeItem(`form_${key}`);
    }
};

// Analytics and tracking
const Analytics = {
    // Track user action
    trackAction: (action, data = {}) => {
        const event = {
            action,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            user: StorageManager.getUser()?.id,
            data
        };
        
        // Store locally
        const events = JSON.parse(localStorage.getItem('agrismart_analytics') || '[]');
        events.push(event);
        localStorage.setItem('agrismart_analytics', JSON.stringify(events));
        
        // Send to mobile if available
        CrossPlatform.sendToMobile({ type: 'analytics', event });
    },
    
    // Get analytics data
    getAnalytics: () => {
        return JSON.parse(localStorage.getItem('agrismart_analytics') || '[]');
    }
};

// Make utilities globally available
window.StorageManager = StorageManager;
window.Validators = Validators;
window.DateUtils = DateUtils;
window.Formatters = Formatters;
window.StringUtils = StringUtils;
window.DOMUtils = DOMUtils;
window.Notifications = Notifications;
window.NetworkUtils = NetworkUtils;
window.Navigation = Navigation;
window.CrossPlatform = CrossPlatform;
window.FormUtils = FormUtils;
window.Analytics = Analytics;
