/**
 * Disease Detection Service
 * Handles disease detection and plant health analysis
 */

class DiseaseService {
    // Detect disease from uploaded image
    async detectDisease(imageFile, cropType = null) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            if (cropType) {
                formData.append('crop_type', cropType);
            }

            const response = await window.apiService.uploadFile('/diseases/detect', formData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Disease detection error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get disease information
    async getDiseaseInfo(diseaseId) {
        try {
            const response = await window.apiService.get(`/diseases/${diseaseId}`);
            return { success: true, data: response.disease };
        } catch (error) {
            console.error('Get disease info error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get disease list for a crop
    async getDiseaseList(cropType) {
        try {
            const response = await window.apiService.get('/diseases/list', { crop: cropType });
            return { success: true, data: response.diseases };
        } catch (error) {
            console.error('Get disease list error:', error);
            return { success: false, error: error.message };
        }
    }

    // Save detection result
    async saveDetectionResult(detectionData) {
        try {
            const response = await window.apiService.post('/diseases/save-detection', detectionData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Save detection result error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user's detection history
    async getDetectionHistory(limit = 10) {
        try {
            const response = await window.apiService.get('/diseases/history', { limit });
            return { success: true, data: response.history };
        } catch (error) {
            console.error('Get detection history error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get treatment recommendations
    async getTreatmentRecommendations(diseaseId) {
        try {
            const response = await window.apiService.get(`/diseases/${diseaseId}/treatment`);
            return { success: true, data: response.treatments };
        } catch (error) {
            console.error('Get treatment recommendations error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.diseaseService = new DiseaseService();