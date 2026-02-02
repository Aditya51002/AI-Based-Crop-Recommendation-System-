/**
 * Crop Recommendation Service
 * Handles crop recommendation API interactions
 */

class CropService {
    // Get crop recommendation
    async getCropRecommendation(data) {
        try {
            const response = await window.apiService.post('/crops/recommend', data);
            return { success: true, data: response };
        } catch (error) {
            console.error('Crop recommendation error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get crop list
    async getCropList() {
        try {
            const response = await window.apiService.get('/crops/list');
            return { success: true, data: response.crops };
        } catch (error) {
            console.error('Get crop list error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get crop details
    async getCropDetails(cropId) {
        try {
            const response = await window.apiService.get(`/crops/${cropId}`);
            return { success: true, data: response.crop };
        } catch (error) {
            console.error('Get crop details error:', error);
            return { success: false, error: error.message };
        }
    }

    // Save recommendation result
    async saveRecommendation(recommendationData) {
        try {
            const response = await window.apiService.post('/crops/save-recommendation', recommendationData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Save recommendation error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user's recommendation history
    async getRecommendationHistory(limit = 10) {
        try {
            const response = await window.apiService.get('/crops/history', { limit });
            return { success: true, data: response.history };
        } catch (error) {
            console.error('Get recommendation history error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.cropService = new CropService();