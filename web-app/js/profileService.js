/**
 * Profile Service
 * Handles user profile management
 */

class ProfileService {
    // Get user profile
    async getUserProfile() {
        try {
            const response = await window.apiService.get('/profile');
            return { success: true, data: response.profile };
        } catch (error) {
            console.error('Get user profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await window.apiService.put('/profile', profileData);
            
            // Update local user data
            if (response.success && response.user) {
                window.authService.saveUserToStorage(response.user);
            }
            
            return { success: true, data: response.user };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload profile avatar
    async uploadAvatar(imageFile) {
        try {
            const formData = new FormData();
            formData.append('avatar', imageFile);

            const response = await window.apiService.uploadFile('/profile/avatar', formData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Upload avatar error:', error);
            return { success: false, error: error.message };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await window.apiService.put('/profile/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            return { success: true, message: response.message };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user statistics
    async getUserStats() {
        try {
            const response = await window.apiService.get('/profile/stats');
            return { success: true, data: response.stats };
        } catch (error) {
            console.error('Get user stats error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get activity history
    async getActivityHistory(limit = 20, type = null) {
        try {
            const params = { limit };
            if (type) params.type = type;

            const response = await window.apiService.get('/profile/activity', params);
            return { success: true, data: response.activity };
        } catch (error) {
            console.error('Get activity history error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete account
    async deleteAccount(password) {
        try {
            const response = await window.apiService.delete('/profile/delete', {
                password: password
            });
            
            // Logout user after account deletion
            if (response.success) {
                window.authService.logout();
            }
            
            return { success: true, message: response.message };
        } catch (error) {
            console.error('Delete account error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get notification preferences
    async getNotificationPreferences() {
        try {
            const response = await window.apiService.get('/profile/notifications');
            return { success: true, data: response.preferences };
        } catch (error) {
            console.error('Get notification preferences error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update notification preferences
    async updateNotificationPreferences(preferences) {
        try {
            const response = await window.apiService.put('/profile/notifications', preferences);
            return { success: true, data: response.preferences };
        } catch (error) {
            console.error('Update notification preferences error:', error);
            return { success: false, error: error.message };
        }
    }

    // Export user data
    async exportUserData() {
        try {
            const response = await window.apiService.get('/profile/export');
            return { success: true, data: response };
        } catch (error) {
            console.error('Export user data error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.profileService = new ProfileService();