/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.loadUserFromStorage();
    }

    // Load user from localStorage
    loadUserFromStorage() {
        const userData = localStorage.getItem('agrismart_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.logout();
            }
        }
    }

    // Save user to localStorage
    saveUserToStorage(user) {
        localStorage.setItem('agrismart_user', JSON.stringify(user));
        this.currentUser = user;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser && !!localStorage.getItem('agrismart_token');
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Register new user
    async register(userData) {
        try {
            const response = await window.apiService.post('/auth/register', userData);
            
            if (response.success) {
                // Set token and user data
                window.apiService.setToken(response.token);
                this.saveUserToStorage(response.user);
                
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await window.apiService.post('/auth/login', credentials);
            
            if (response.success) {
                // Set token and user data
                window.apiService.setToken(response.token);
                this.saveUserToStorage(response.user);
                
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    logout() {
        // Clear token
        window.apiService.setToken(null);
        
        // Clear user data
        localStorage.removeItem('agrismart_user');
        this.currentUser = null;
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    // Forgot password
    async forgotPassword(phone) {
        try {
            const response = await window.apiService.post('/auth/forgot-password', { phone });
            return { success: true, message: response.message };
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(data) {
        try {
            const response = await window.apiService.post('/auth/reset-password', data);
            return { success: true, message: response.message };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    // Verify OTP
    async verifyOTP(data) {
        try {
            const response = await window.apiService.post('/auth/verify-otp', data);
            
            if (response.success) {
                if (response.token) {
                    window.apiService.setToken(response.token);
                    this.saveUserToStorage(response.user);
                }
                return { success: true, message: response.message };
            } else {
                throw new Error(response.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user profile
    async updateProfile(userData) {
        try {
            const response = await window.apiService.put('/auth/profile', userData);
            
            if (response.success) {
                this.saveUserToStorage(response.user);
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Profile update failed');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
        }
    }

    // Check authentication status and redirect if needed
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Initialize page with auth check
    initializePage() {
        // Update UI based on auth status
        this.updateAuthUI();
        
        // Add logout handlers
        this.addLogoutHandlers();
    }

    // Update UI based on authentication status
    updateAuthUI() {
        const userNameElements = document.querySelectorAll('.user-name');
        const loginElements = document.querySelectorAll('.btn-login');
        const protectedElements = document.querySelectorAll('.protected-content');

        if (this.isAuthenticated()) {
            const user = this.getCurrentUser();
            
            // Update user name displays
            userNameElements.forEach(el => {
                el.textContent = user.name || user.phone;
                el.style.display = 'block';
            });
            
            // Hide login buttons
            loginElements.forEach(el => {
                el.style.display = 'none';
            });
            
            // Show protected content
            protectedElements.forEach(el => {
                el.style.display = 'block';
            });
        } else {
            // Hide user name displays
            userNameElements.forEach(el => {
                el.style.display = 'none';
            });
            
            // Show login buttons
            loginElements.forEach(el => {
                el.style.display = 'block';
            });
            
            // Hide protected content
            protectedElements.forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // Add logout event handlers
    addLogoutHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn') || 
                e.target.closest('.logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });
    }
}

// Create and export singleton instance
window.authService = new AuthService();