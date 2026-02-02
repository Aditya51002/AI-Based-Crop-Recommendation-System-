/**
 * UI Helper Service
 * Common UI utilities and form helpers
 */

class UIHelperService {
    // Show loading state
    showLoading(element, text = 'Loading...') {
        if (!element) return;
        
        const originalContent = element.innerHTML;
        const originalDisabled = element.disabled;
        
        element.disabled = true;
        element.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                <div style="
                    width: 16px; 
                    height: 16px; 
                    border: 2px solid rgba(255,255,255,0.3); 
                    border-radius: 50%; 
                    border-top: 2px solid white; 
                    animation: spin 1s linear infinite;
                "></div>
                ${text}
            </div>
        `;
        
        // Add spinner animation if not exists
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
        
        return {
            restore: () => {
                element.innerHTML = originalContent;
                element.disabled = originalDisabled;
            }
        };
    }

    // Hide loading state
    hideLoading(element, originalContent, originalDisabled = false) {
        if (!element) return;
        element.innerHTML = originalContent;
        element.disabled = originalDisabled;
    }

    // Validate form fields
    validateForm(formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Clear previous error styles
            input.classList.remove('error');
            
            // Required field validation
            if (input.hasAttribute('required') && !input.value.trim()) {
                errors.push(`${this.getFieldLabel(input)} is required`);
                input.classList.add('error');
                return;
            }
            
            // Email validation
            if (input.type === 'email' && input.value) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(input.value)) {
                    errors.push(`Please enter a valid email address`);
                    input.classList.add('error');
                }
            }
            
            // Phone validation
            if (input.type === 'tel' && input.value) {
                const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phonePattern.test(input.value.replace(/\s+/g, ''))) {
                    errors.push(`Please enter a valid phone number`);
                    input.classList.add('error');
                }
            }
            
            // Password validation
            if (input.type === 'password' && input.value) {
                if (input.value.length < 6) {
                    errors.push(`Password must be at least 6 characters long`);
                    input.classList.add('error');
                }
            }
            
            // Number validation
            if (input.type === 'number' && input.value) {
                const min = input.getAttribute('min');
                const max = input.getAttribute('max');
                const value = parseFloat(input.value);
                
                if (min && value < parseFloat(min)) {
                    errors.push(`${this.getFieldLabel(input)} must be at least ${min}`);
                    input.classList.add('error');
                }
                
                if (max && value > parseFloat(max)) {
                    errors.push(`${this.getFieldLabel(input)} must be at most ${max}`);
                    input.classList.add('error');
                }
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Get field label for validation messages
    getFieldLabel(input) {
        const label = input.parentNode.querySelector('label');
        if (label) {
            return label.textContent.replace('*', '').trim();
        }
        return input.name || input.id || 'Field';
    }

    // Format currency
    formatCurrency(amount, currency = '₹') {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return `${currency}${amount.toLocaleString('en-IN')}`;
    }

    // Format date
    formatDate(date, options = {}) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return date.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
    }

    // Format relative time
    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffSecs = Math.round(diffMs / 1000);
        const diffMins = Math.round(diffSecs / 60);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);
        
        if (diffSecs < 60) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
            return this.formatDate(date);
        }
    }

    // Debounce function
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }

    // Generate random ID
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // Add error styles to form
    addErrorStyles() {
        if (document.querySelector('#error-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }
            
            .error:focus {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize UI helpers
    init() {
        this.addErrorStyles();
        
        // Add global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal[style*="display: flex"]');
                modals.forEach(modal => {
                    const closeBtn = modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                });
            }
        });
        // Initialize reveal-on-scroll for elements with .reveal-on-scroll
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        if (el.classList.contains('reveal-group')) {
                            el.classList.add('revealed');
                        } else {
                            el.classList.add('reveal');
                        }
                        obs.unobserve(el);
                    }
                });
            }, { threshold: 0.12 });

            document.querySelectorAll('.reveal-on-scroll, .reveal-group').forEach(n => revealObserver.observe(n));
        } else {
            // Fallback: reveal immediately
            document.querySelectorAll('.reveal-on-scroll, .reveal-group').forEach(n => n.classList.add('reveal'));
        }

        // Page transition overlay: fade overlay, then navigate
        const pageFade = document.getElementById('page-fade');
        if (pageFade) {
            document.addEventListener('click', (e) => {
                const a = e.target.closest('a');
                if (!a) return;
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || a.target === '_blank') return;
                // don't animate for same-page anchors
                e.preventDefault();
                pageFade.classList.add('active');
                setTimeout(() => { window.location.href = href; }, 260);
            }, { capture: true });

            // Remove overlay on load
            window.addEventListener('pageshow', () => { setTimeout(() => pageFade.classList.remove('active'), 120); });
        }

        // Interactive card mouse-follow glow: set --mouse-x/--mouse-y on cards
        try {
            // Ensure interactive card effects are scoped to homepage
            const body = document.body;
            if (body.classList.contains('page-home')) {
                const cards = document.querySelectorAll('.page-home .feature-card');
                cards.forEach((card) => {
                    const update = (x, y) => {
                        const rect = card.getBoundingClientRect();
                        const offsetX = ((x - rect.left) / rect.width) * 100;
                        const offsetY = ((y - rect.top) / rect.height) * 100;
                        card.style.setProperty('--mouse-x', `${offsetX}%`);
                        card.style.setProperty('--mouse-y', `${offsetY}%`);
                    };

                    let ticking = false;
                    const onMove = (e) => {
                        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                        if (!ticking) {
                            window.requestAnimationFrame(() => {
                                update(clientX, clientY);
                                ticking = false;
                            });
                            ticking = true;
                        }
                    };

                    card.addEventListener('mousemove', onMove);
                    card.addEventListener('touchmove', onMove, { passive: true });
                    card.addEventListener('mouseleave', () => {
                        card.style.setProperty('--mouse-x', '50%');
                        card.style.setProperty('--mouse-y', '50%');
                    });
                    card.addEventListener('touchend', () => {
                        card.style.setProperty('--mouse-x', '50%');
                        card.style.setProperty('--mouse-y', '50%');
                    });
                });
            }
        } catch (err) {
            console.error('Interactive card glow init failed', err);
        }
    }
}

// Create and export singleton instance
window.uiHelper = new UIHelperService();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.uiHelper.init());
} else {
    window.uiHelper.init();
}