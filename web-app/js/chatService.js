/**
 * Chatbot Service
 * Handles multilingual chat and voice interactions
 */

class ChatService {
    // Send chat message
    async sendMessage(message, language = 'en', context = {}) {
        try {
            const response = await window.apiService.post('/chat/message', {
                message: message,
                language: language,
                context: context
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Send message error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get chat history
    async getChatHistory(limit = 20) {
        try {
            const response = await window.apiService.get('/chat/history', { limit });
            return { success: true, data: response.history };
        } catch (error) {
            console.error('Get chat history error:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear chat history
    async clearChatHistory() {
        try {
            const response = await window.apiService.delete('/chat/history');
            return { success: true, data: response };
        } catch (error) {
            console.error('Clear chat history error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get supported languages
    async getSupportedLanguages() {
        try {
            const response = await window.apiService.get('/chat/languages');
            return { success: true, data: response.languages };
        } catch (error) {
            console.error('Get supported languages error:', error);
            return { success: false, error: error.message };
        }
    }

    // Voice to text conversion
    async voiceToText(audioBlob, language = 'en') {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);
            formData.append('language', language);

            const response = await window.apiService.uploadFile('/chat/voice-to-text', formData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Voice to text error:', error);
            return { success: false, error: error.message };
        }
    }

    // Text to speech conversion
    async textToSpeech(text, language = 'en') {
        try {
            const response = await window.apiService.post('/chat/text-to-speech', {
                text: text,
                language: language
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Text to speech error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get FAQ categories
    async getFAQCategories() {
        try {
            const response = await window.apiService.get('/chat/faq/categories');
            return { success: true, data: response.categories };
        } catch (error) {
            console.error('Get FAQ categories error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get FAQ by category
    async getFAQByCategory(category, language = 'en') {
        try {
            const response = await window.apiService.get('/chat/faq', {
                category: category,
                language: language
            });
            return { success: true, data: response.faqs };
        } catch (error) {
            console.error('Get FAQ by category error:', error);
            return { success: false, error: error.message };
        }
    }

    // Send feedback
    async sendFeedback(rating, comment) {
        try {
            const response = await window.apiService.post('/chat/feedback', {
                rating: rating,
                comment: comment
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Send feedback error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.chatService = new ChatService();