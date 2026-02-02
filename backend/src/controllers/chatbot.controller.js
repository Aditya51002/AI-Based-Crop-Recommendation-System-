/**
 * Chatbot Controller
 * AI-powered agricultural assistant
 */

const History = require('../models/History');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Knowledge base for agricultural queries
const knowledgeBase = {
    crops: {
        keywords: ['crop', 'plant', 'grow', 'cultivation', 'farming', 'seed', 'harvest'],
        responses: [
            'For crop selection, consider your soil type, climate, and water availability. Key factors include soil pH, temperature range, and rainfall patterns.',
            'Popular crops in India include rice, wheat, maize, cotton, and pulses. The choice depends on your region and season.',
            'Crop rotation is essential for maintaining soil health. Alternate between nitrogen-fixing crops like pulses and high-demand crops like cereals.',
            'For best yields, use certified seeds, maintain proper spacing, and follow recommended fertilizer schedules.'
        ]
    },
    soil: {
        keywords: ['soil', 'ph', 'fertility', 'nutrient', 'nitrogen', 'phosphorus', 'potassium'],
        responses: [
            'Soil testing is crucial before planting. Test for pH, NPK levels, organic matter, and micronutrients.',
            'Ideal soil pH for most crops is 6.0-7.0. Apply lime to raise pH or sulfur to lower it.',
            'To improve soil fertility, add organic matter like compost, green manure, or vermicompost.',
            'NPK fertilizers should be applied based on soil test results and crop requirements. Avoid over-fertilization.'
        ]
    },
    irrigation: {
        keywords: ['water', 'irrigation', 'watering', 'drought', 'moisture', 'drip', 'sprinkler'],
        responses: [
            'Drip irrigation is the most water-efficient method, saving up to 60% water compared to flood irrigation.',
            'Water requirements vary by crop stage. Critical stages like flowering need adequate moisture.',
            'Monitor soil moisture regularly. Over-watering can lead to root rot and nutrient leaching.',
            'Mulching helps conserve soil moisture and reduce irrigation frequency by up to 25%.'
        ]
    },
    pests: {
        keywords: ['pest', 'insect', 'disease', 'fungus', 'virus', 'control', 'spray', 'pesticide'],
        responses: [
            'Integrated Pest Management (IPM) combines biological, cultural, and chemical methods for sustainable pest control.',
            'Early detection is key. Regularly scout your fields and look for signs of pest damage.',
            'Use biological controls like neem oil, pheromone traps, and beneficial insects before chemical pesticides.',
            'Always follow recommended dosages for pesticides and maintain safety periods before harvest.'
        ]
    },
    weather: {
        keywords: ['weather', 'rain', 'temperature', 'climate', 'monsoon', 'forecast', 'season'],
        responses: [
            'Monitor weather forecasts regularly for planning irrigation, spraying, and harvest activities.',
            'Protect crops from extreme weather using mulching, shade nets, and proper drainage.',
            'Monsoon planning is crucial in India. Prepare fields before rains and ensure proper drainage.',
            'Use weather-based crop insurance to protect against climate-related losses.'
        ]
    },
    market: {
        keywords: ['price', 'market', 'sell', 'mandi', 'msp', 'trade', 'export'],
        responses: [
            'Check daily mandi prices before selling. Prices can vary significantly between markets.',
            'Government MSP (Minimum Support Price) provides price security for major crops.',
            'Consider storage facilities to sell during off-season when prices are higher.',
            'Quality grading can fetch 10-20% higher prices. Invest in proper post-harvest handling.'
        ]
    },
    organic: {
        keywords: ['organic', 'natural', 'chemical-free', 'bio', 'compost', 'manure'],
        responses: [
            'Organic farming requires 3 years of transition period for certification.',
            'Organic inputs include vermicompost, bio-fertilizers, and natural pest repellents.',
            'Organic produce often fetches 20-40% premium prices but requires careful marketing.',
            'Join farmer groups or cooperatives for organic certification and marketing support.'
        ]
    },
    general: {
        keywords: ['hello', 'hi', 'help', 'how', 'what', 'when', 'where', 'why'],
        responses: [
            'Hello! I\'m AgriBot, your agricultural assistant. How can I help you today?',
            'I can help with crop recommendations, pest management, weather advice, and market information.',
            'Ask me anything about farming, and I\'ll try my best to assist you!',
            'For specific crop recommendations, try our Crop Recommendation feature with soil and climate data.'
        ]
    }
};

// Suggested questions
const suggestions = [
    'What crops are best for this season?',
    'How do I improve soil fertility?',
    'What is the best irrigation method?',
    'How to control pests naturally?',
    'What are current market prices?',
    'How to prepare for monsoon?',
    'Tell me about organic farming',
    'What fertilizers should I use?'
];

/**
 * Find best matching response
 */
const findResponse = (message) => {
    const lowercaseMsg = message.toLowerCase();
    let bestMatch = null;
    let maxScore = 0;
    
    // Check each category
    for (const [category, data] of Object.entries(knowledgeBase)) {
        let score = 0;
        
        data.keywords.forEach(keyword => {
            if (lowercaseMsg.includes(keyword)) {
                score += 1;
            }
        });
        
        if (score > maxScore) {
            maxScore = score;
            bestMatch = data;
        }
    }
    
    // Return random response from matched category
    if (bestMatch && maxScore > 0) {
        const responses = bestMatch.responses;
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Default response
    return knowledgeBase.general.responses[Math.floor(Math.random() * knowledgeBase.general.responses.length)];
};

/**
 * Generate contextual suggestions
 */
const getContextualSuggestions = (message) => {
    const lowercaseMsg = message.toLowerCase();
    const contextSuggestions = [];
    
    if (lowercaseMsg.includes('crop') || lowercaseMsg.includes('plant')) {
        contextSuggestions.push('What soil conditions are needed?');
        contextSuggestions.push('When is the best time to plant?');
    }
    
    if (lowercaseMsg.includes('pest') || lowercaseMsg.includes('disease')) {
        contextSuggestions.push('How to identify the pest?');
        contextSuggestions.push('What are organic control methods?');
    }
    
    if (lowercaseMsg.includes('water') || lowercaseMsg.includes('irrigation')) {
        contextSuggestions.push('How much water is needed?');
        contextSuggestions.push('What irrigation system is best?');
    }
    
    // Fill with general suggestions if needed
    while (contextSuggestions.length < 4) {
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        if (!contextSuggestions.includes(randomSuggestion)) {
            contextSuggestions.push(randomSuggestion);
        }
    }
    
    return contextSuggestions.slice(0, 4);
};

/**
 * Send message to chatbot
 * POST /api/chatbot
 */
exports.sendMessage = async (req, res, next) => {
    try {
        const { message, sessionId } = req.body;
        
        // Find response
        const response = findResponse(message);
        const contextSuggestions = getContextualSuggestions(message);
        
        // Log to history if user is authenticated
        if (req.user) {
            await History.addEntry(req.user._id, 'chatbot', {
                message,
                response,
                sessionId
            });
        }
        
        logger.info(`Chatbot query: "${message.substring(0, 50)}..."`);
        
        return successResponse(res, {
            response,
            suggestions: contextSuggestions,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || `session-${Date.now()}`
        }, 'Message processed');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get chat history
 * GET /api/chatbot/history
 */
exports.getHistory = async (req, res, next) => {
    try {
        if (!req.user) {
            return successResponse(res, { history: [] }, 'No history available');
        }
        
        const history = await History.getUserHistory(req.user._id, {
            type: 'chatbot',
            limit: parseInt(req.query.limit) || 50
        });
        
        return successResponse(res, { history }, 'Chat history retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Clear chat history
 * DELETE /api/chatbot/history
 */
exports.clearHistory = async (req, res, next) => {
    try {
        if (!req.user) {
            return successResponse(res, null, 'No history to clear');
        }
        
        await History.deleteMany({
            userId: req.user._id,
            type: 'chatbot'
        });
        
        logger.info(`Chat history cleared for user: ${req.user.phone}`);
        
        return successResponse(res, null, 'Chat history cleared');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get suggested questions
 * GET /api/chatbot/suggestions
 */
exports.getSuggestions = async (req, res, next) => {
    try {
        // Shuffle and return suggestions
        const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
        
        return successResponse(res, {
            suggestions: shuffled.slice(0, 6),
            categories: Object.keys(knowledgeBase).filter(k => k !== 'general')
        }, 'Suggestions retrieved');
        
    } catch (error) {
        next(error);
    }
};
