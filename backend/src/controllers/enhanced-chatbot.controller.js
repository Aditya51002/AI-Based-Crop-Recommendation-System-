/**
 * Enhanced Chatbot Controller
 * Handles multilingual chat with agricultural expertise and voice support
 */

const ChatHistory = require('../models/ChatHistory');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Send message to chatbot
 * POST /api/chat/message
 */
exports.sendMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { message, language = 'en', sessionId, context } = req.body;
        
        if (!message || message.trim().length === 0) {
            return errorResponse(res, 'Message is required', 400);
        }
        
        if (message.length > 1000) {
            return errorResponse(res, 'Message too long. Please keep it under 1000 characters.', 400);
        }
        
        // Generate or use existing session ID
        const currentSessionId = sessionId || `chat-${userId}-${Date.now()}`;
        
        // Save user message to history
        await saveMessageToHistory(userId, currentSessionId, message, 'user', language);
        
        // Generate AI response based on message content and context
        const aiResponse = await generateAIResponse(message, language, context, userId);
        
        // Save AI response to history
        await saveMessageToHistory(userId, currentSessionId, aiResponse.message, 'assistant', language, aiResponse.metadata);
        
        logger.info(`Chat message processed for user: ${userId}, language: ${language}`);
        
        return successResponse(res, {
            response: aiResponse.message,
            sessionId: currentSessionId,
            language,
            metadata: aiResponse.metadata,
            suggestions: aiResponse.suggestions || []
        }, 'Message processed successfully');
        
    } catch (error) {
        logger.error('Send message error:', error);
        next(error);
    }
};

/**
 * Get chat history
 * GET /api/chat/history
 */
exports.getChatHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sessionId, limit = 50, page = 1 } = req.query;
        
        const pageLimit = Math.min(parseInt(limit), 100);
        const skip = (parseInt(page) - 1) * pageLimit;
        
        let query = { userId };
        
        if (sessionId) {
            query.sessionId = sessionId;
        }
        
        // Demo mode check
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const mockHistory = generateMockChatHistory(userId, sessionId);
            
            return successResponse(res, {
                history: mockHistory,
                pagination: {
                    page: 1,
                    limit: pageLimit,
                    total: mockHistory.length,
                    pages: 1
                }
            }, 'Chat history retrieved (Demo Mode)');
        }
        
        const [history, total] = await Promise.all([
            ChatHistory.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(pageLimit)
                .select('-__v'),
            ChatHistory.countDocuments(query)
        ]);
        
        return successResponse(res, {
            history: history.reverse(), // Show chronological order
            pagination: {
                page: parseInt(page),
                limit: pageLimit,
                total,
                pages: Math.ceil(total / pageLimit)
            }
        }, 'Chat history retrieved successfully');
        
    } catch (error) {
        logger.error('Get chat history error:', error);
        next(error);
    }
};

/**
 * Get chat sessions
 * GET /api/chat/sessions
 */
exports.getChatSessions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const mockSessions = [
                {
                    sessionId: 'demo-session-1',
                    lastMessage: 'What are the best practices for rice cultivation?',
                    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    messageCount: 8,
                    language: 'en'
                },
                {
                    sessionId: 'demo-session-2',
                    lastMessage: 'मेरी फसल में रोग लग गया है, क्या करूं?',
                    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    messageCount: 12,
                    language: 'hi'
                }
            ];
            
            return successResponse(res, {
                sessions: mockSessions
            }, 'Chat sessions retrieved (Demo Mode)');
        }
        
        const sessions = await ChatHistory.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$sessionId',
                    lastMessage: { $last: '$message' },
                    lastActivity: { $max: '$timestamp' },
                    messageCount: { $sum: 1 },
                    language: { $last: '$language' }
                }
            },
            { $sort: { lastActivity: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    sessionId: '$_id',
                    lastMessage: 1,
                    lastActivity: 1,
                    messageCount: 1,
                    language: 1
                }
            }
        ]);
        
        return successResponse(res, {
            sessions
        }, 'Chat sessions retrieved successfully');
        
    } catch (error) {
        logger.error('Get chat sessions error:', error);
        next(error);
    }
};

/**
 * Clear chat session
 * DELETE /api/chat/sessions/:sessionId
 */
exports.clearChatSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return errorResponse(res, 'Session ID is required', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (!isDemoMode) {
            await ChatHistory.deleteMany({ userId, sessionId });
        }
        
        logger.info(`Chat session ${sessionId} cleared for user: ${userId}`);
        
        return successResponse(res, {
            message: 'Chat session cleared successfully'
        }, 'Session cleared');
        
    } catch (error) {
        logger.error('Clear chat session error:', error);
        next(error);
    }
};

/**
 * Get chat suggestions
 * GET /api/chat/suggestions
 */
exports.getChatSuggestions = async (req, res, next) => {
    try {
        const { language = 'en', category } = req.query;
        
        const suggestions = getChatSuggestions(language, category);
        
        return successResponse(res, {
            suggestions
        }, 'Chat suggestions retrieved successfully');
        
    } catch (error) {
        logger.error('Get chat suggestions error:', error);
        next(error);
    }
};

/**
 * Process voice message
 * POST /api/chat/voice
 */
exports.processVoiceMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { audioData, language = 'en', sessionId } = req.body;
        
        if (!audioData) {
            return errorResponse(res, 'Audio data is required', 400);
        }
        
        // Mock voice-to-text processing
        const transcribedText = await mockVoiceToText(audioData, language);
        
        if (!transcribedText) {
            return errorResponse(res, 'Could not transcribe audio. Please try again.', 400);
        }
        
        // Process as regular chat message
        const currentSessionId = sessionId || `chat-${userId}-${Date.now()}`;
        
        // Save transcribed message
        await saveMessageToHistory(userId, currentSessionId, transcribedText, 'user', language, { 
            inputType: 'voice',
            transcribed: true
        });
        
        // Generate AI response
        const aiResponse = await generateAIResponse(transcribedText, language, null, userId);
        
        // Save AI response
        await saveMessageToHistory(userId, currentSessionId, aiResponse.message, 'assistant', language, aiResponse.metadata);
        
        logger.info(`Voice message processed for user: ${userId}, language: ${language}`);
        
        return successResponse(res, {
            transcription: transcribedText,
            response: aiResponse.message,
            sessionId: currentSessionId,
            language,
            metadata: aiResponse.metadata
        }, 'Voice message processed successfully');
        
    } catch (error) {
        logger.error('Process voice message error:', error);
        next(error);
    }
};

/**
 * Save message to chat history
 */
async function saveMessageToHistory(userId, sessionId, message, sender, language, metadata = {}) {
    try {
        const isDemoMode = !require('mongoose').connection.readyState;
        if (isDemoMode) return;
        
        const chatMessage = new ChatHistory({
            userId,
            sessionId,
            message,
            sender,
            language,
            metadata,
            timestamp: new Date()
        });
        
        await chatMessage.save();
    } catch (error) {
        logger.warn('Failed to save chat history:', error);
    }
}

/**
 * Generate AI response based on message content
 */
async function generateAIResponse(message, language, context, userId) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lowerMessage = message.toLowerCase();
    
    // Detect intent and generate appropriate response
    let response, category, suggestions = [];
    
    // Agricultural queries
    if (lowerMessage.includes('crop') || lowerMessage.includes('farming') || lowerMessage.includes('agriculture')) {
        category = 'agriculture';
        response = generateAgriculturalResponse(message, language);
        suggestions = getAgriculturalSuggestions(language);
    }
    // Disease detection queries
    else if (lowerMessage.includes('disease') || lowerMessage.includes('pest') || lowerMessage.includes('रोग') || lowerMessage.includes('कीट')) {
        category = 'disease';
        response = generateDiseaseResponse(message, language);
        suggestions = getDiseaseSuggestions(language);
    }
    // Weather queries
    else if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('मौसम') || lowerMessage.includes('बारिश')) {
        category = 'weather';
        response = generateWeatherResponse(message, language);
        suggestions = getWeatherSuggestions(language);
    }
    // Market price queries
    else if (lowerMessage.includes('price') || lowerMessage.includes('market') || lowerMessage.includes('sell') || lowerMessage.includes('दाम') || lowerMessage.includes('बाजार')) {
        category = 'market';
        response = generateMarketResponse(message, language);
        suggestions = getMarketSuggestions(language);
    }
    // Soil queries
    else if (lowerMessage.includes('soil') || lowerMessage.includes('fertilizer') || lowerMessage.includes('मिट्टी') || lowerMessage.includes('खाद')) {
        category = 'soil';
        response = generateSoilResponse(message, language);
        suggestions = getSoilSuggestions(language);
    }
    // Irrigation queries
    else if (lowerMessage.includes('water') || lowerMessage.includes('irrigation') || lowerMessage.includes('पानी') || lowerMessage.includes('सिंचाई')) {
        category = 'irrigation';
        response = generateIrrigationResponse(message, language);
        suggestions = getIrrigationSuggestions(language);
    }
    // General greeting
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('नमस्ते') || lowerMessage.includes('हैलो')) {
        category = 'greeting';
        response = getGreetingResponse(language);
        suggestions = getGeneralSuggestions(language);
    }
    // Default response
    else {
        category = 'general';
        response = getDefaultResponse(message, language);
        suggestions = getGeneralSuggestions(language);
    }
    
    return {
        message: response,
        metadata: {
            category,
            language,
            responseType: 'generated',
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            timestamp: new Date().toISOString()
        },
        suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
    };
}

/**
 * Generate agricultural response
 */
function generateAgriculturalResponse(message, language) {
    const responses = {
        en: [
            "For successful crop cultivation, consider factors like soil type, climate, water availability, and market demand. Which specific crop are you interested in?",
            "Good agricultural practices include proper seed selection, timely sowing, balanced fertilization, and integrated pest management. What aspect would you like to know more about?",
            "Crop rotation, soil health management, and sustainable farming practices are key to long-term agricultural success. How can I help you with your farming plans?",
            "Modern agriculture benefits from technology integration, precise nutrient management, and climate-smart practices. What specific guidance do you need?"
        ],
        hi: [
            "सफल फसल उत्पादन के लिए मिट्टी का प्रकार, जलवायु, पानी की उपलब्धता और बाजार की मांग पर विचार करें। आप किस विशेष फसल में रुचि रखते हैं?",
            "अच्छी कृषि प्रथाओं में उचित बीज चयन, समय पर बुआई, संतुलित उर्वरीकरण और एकीकृत कीट प्रबंधन शामिल है। आप किस पहलू के बारे में और जानना चाहते हैं?",
            "फसल चक्र, मिट्टी स्वास्थ्य प्रबंधन और टिकाऊ कृषि प्रथाएं दीर्घकालिक कृषि सफलता की कुंजी हैं। मैं आपकी कृषि योजनाओं में कैसे मदद कर सकता हूं?",
            "आधुनिक कृषि प्रौद्योगिकी एकीकरण, सटीक पोषक तत्व प्रबंधन और जलवायु-स्मार्ट प्रथाओं से लाभान्वित होती है। आपको क्या विशेष मार्गदर्शन चाहिए?"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Generate disease response
 */
function generateDiseaseResponse(message, language) {
    const responses = {
        en: [
            "Disease management requires early detection and proper identification. Can you describe the symptoms you're observing or share a photo of the affected plant?",
            "Common plant diseases include fungal, bacterial, and viral infections. Prevention through proper sanitation, crop rotation, and resistant varieties is key. What symptoms are you seeing?",
            "Integrated disease management combines cultural, biological, and chemical control methods. Early intervention is crucial. Can you tell me more about the affected crop and symptoms?",
            "Disease prevention is better than cure. Ensure proper plant spacing, avoid overhead watering, and maintain field hygiene. What specific disease concerns do you have?"
        ],
        hi: [
            "रोग प्रबंधन के लिए जल्दी पहचान और उचित निदान आवश्यक है। क्या आप देखे गए लक्षणों का वर्णन कर सकते हैं या प्रभावित पौधे की फोटो साझा कर सकते हैं?",
            "सामान्य पौधों के रोगों में फंगल, बैक्टीरियल और वायरल संक्रमण शामिल हैं। उचित सफाई, फसल चक्र और प्रतिरोधी किस्मों के माध्यम से रोकथाम महत्वपूर्ण है। आप कौन से लक्षण देख रहे हैं?",
            "एकीकृत रोग प्रबंधन सांस्कृतिक, जैविक और रासायनिक नियंत्रण विधियों को जोड़ता है। जल्दी हस्तक्षेप महत्वपूर्ण है। क्या आप प्रभावित फसल और लक्षणों के बारे में और बता सकते हैं?",
            "रोग की रोकथाम इलाज से बेहतर है। उचित पौधों की दूरी सुनिश्चित करें, ऊपर से पानी देने से बचें और खेत की स्वच्छता बनाए रखें। आपकी कौन सी विशेष रोग संबंधी चिंताएं हैं?"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Generate weather response
 */
function generateWeatherResponse(message, language) {
    const responses = {
        en: [
            "Weather plays a crucial role in agriculture. I can help you with current conditions, forecasts, and agricultural advisories. What location are you interested in?",
            "Understanding weather patterns helps in planning farm activities like sowing, irrigation, and harvesting. Would you like current weather data or a forecast?",
            "Weather alerts can help protect your crops from extreme conditions. I can provide location-specific weather information and agricultural guidance.",
            "Seasonal weather patterns affect crop selection and farming practices. Let me know your location, and I can provide relevant weather insights."
        ],
        hi: [
            "मौसम कृषि में महत्वपूर्ण भूमिका निभाता है। मैं वर्तमान स्थितियों, पूर्वानुमान और कृषि सलाह के साथ आपकी मदद कर सकता हूं। आप किस स्थान में रुचि रखते हैं?",
            "मौसम के पैटर्न को समझना बुआई, सिंचाई और फसल की कटाई जैसी खेती की गतिविधियों की योजना बनाने में मदद करता है। क्या आप वर्तमान मौसम डेटा या पूर्वानुमान चाहते हैं?",
            "मौसम चेतावनियां आपकी फसलों को चरम स्थितियों से बचाने में मदद कर सकती हैं। मैं स्थान-विशिष्ट मौसम जानकारी और कृषि मार्गदर्शन प्रदान कर सकता हूं।",
            "मौसमी मौसम पैटर्न फसल चयन और कृषि प्रथाओं को प्रभावित करते हैं। मुझे अपना स्थान बताएं, और मैं संबंधित मौसम अंतर्दृष्टि प्रदान कर सकता हूं।"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Generate market response
 */
function generateMarketResponse(message, language) {
    const responses = {
        en: [
            "Market prices fluctuate based on demand, supply, quality, and seasonal factors. I can help you track current prices and trends. Which crop are you interested in?",
            "Understanding market dynamics helps in making informed selling decisions. I can provide price information, trends, and market insights. What specific market data do you need?",
            "Timing your sales based on market conditions can maximize profits. Let me know the crop and location, and I'll provide relevant market information.",
            "Market intelligence includes current prices, historical trends, and future projections. How can I help you with market-related information today?"
        ],
        hi: [
            "बाजार की कीमतें मांग, आपूर्ति, गुणवत्ता और मौसमी कारकों के आधार पर उतार-चढ़ाव करती हैं। मैं वर्तमान कीमतों और रुझानों को ट्रैक करने में आपकी मदद कर सकता हूं। आप किस फसल में रुचि रखते हैं?",
            "बाजार की गतिशीलता को समझना सूचित बिक्री निर्णय लेने में मदद करता है। मैं कीमत की जानकारी, रुझान और बाजार की अंतर्दृष्टि प्रदान कर सकता हूं। आपको किस विशिष्ट बाजार डेटा की आवश्यकता है?",
            "बाजार की स्थिति के आधार पर बिक्री का समय निर्धारण लाभ को अधिकतम कर सकता है। मुझे फसल और स्थान बताएं, और मैं संबंधित बाजार जानकारी प्रदान करूंगा।",
            "बाजार खुफिया में वर्तमान कीमतें, ऐतिहासिक रुझान और भविष्य के अनुमान शामिल हैं। आज मैं बाजार-संबंधित जानकारी के साथ आपकी कैसे मदद कर सकता हूं?"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Generate soil response
 */
function generateSoilResponse(message, language) {
    const responses = {
        en: [
            "Soil health is fundamental to productive agriculture. Regular soil testing, organic matter addition, and proper nutrient management are essential. What soil concerns do you have?",
            "Understanding soil pH, nutrient levels, and organic content helps optimize fertilizer use and crop selection. Have you conducted a recent soil test?",
            "Healthy soil supports plant growth, water retention, and nutrient cycling. Practices like cover cropping and reduced tillage improve soil structure. How can I help with your soil management?",
            "Soil fertility can be enhanced through balanced fertilization, organic amendments, and sustainable practices. What specific soil improvement guidance do you need?"
        ],
        hi: [
            "मिट्टी का स्वास्थ्य उत्पादक कृषि के लिए मौलिक है। नियमित मिट्टी परीक्षण, जैविक पदार्थ जोड़ना और उचित पोषक तत्व प्रबंधन आवश्यक है। आपकी मिट्टी संबंधी क्या चिंताएं हैं?",
            "मिट्टी का pH, पोषक तत्वों का स्तर और जैविक सामग्री को समझना उर्वरक के उपयोग और फसल चयन को अनुकूलित करने में मदद करता है। क्या आपने हाल ही में मिट्टी का परीक्षण कराया है?",
            "स्वस्थ मिट्टी पौधों की वृद्धि, जल धारण और पोषक तत्व चक्रण का समर्थन करती है। कवर क्रॉपिंग और कम जुताई जैसी प्रथाएं मिट्टी की संरचना में सुधार करती हैं। मैं आपके मिट्टी प्रबंधन में कैसे मदद कर सकता हूं?",
            "संतुलित उर्वरीकरण, जैविक संशोधन और टिकाऊ प्रथाओं के माध्यम से मिट्टी की उर्वरता बढ़ाई जा सकती है। आपको किस विशिष्ट मिट्टी सुधार मार्गदर्शन की आवश्यकता है?"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Generate irrigation response
 */
function generateIrrigationResponse(message, language) {
    const responses = {
        en: [
            "Efficient water management optimizes crop yield while conserving resources. Drip irrigation, scheduling, and soil moisture monitoring are key practices. What irrigation challenges do you face?",
            "Water requirements vary by crop, growth stage, and weather conditions. I can help you plan irrigation schedules and choose appropriate systems. What specific guidance do you need?",
            "Modern irrigation techniques like drip and sprinkler systems improve water use efficiency. Consider factors like soil type, crop needs, and water availability. How can I assist with your irrigation planning?",
            "Proper irrigation timing and amount prevent both water stress and waterlogging. Soil moisture sensors and weather-based scheduling help optimize irrigation. What irrigation questions do you have?"
        ],
        hi: [
            "कुशल जल प्रबंधन संसाधनों का संरक्षण करते हुए फसल की उपज को अनुकूलित करता है। ड्रिप सिंचाई, शेड्यूलिंग और मिट्टी की नमी की निगरानी मुख्य प्रथाएं हैं। आपको किन सिंचाई चुनौतियों का सामना करना पड़ता है?",
            "पानी की आवश्यकताएं फसल, वृद्धि चरण और मौसम की स्थिति के अनुसार भिन्न होती हैं। मैं सिंचाई कार्यक्रम की योजना बनाने और उपयुक्त सिस्टम चुनने में आपकी मदद कर सकता हूं। आपको किस विशिष्ट मार्गदर्शन की आवश्यकता है?",
            "ड्रिप और स्प्रिंकलर सिस्टम जैसी आधुनिक सिंचाई तकनीकें पानी के उपयोग की दक्षता में सुधार करती हैं। मिट्टी के प्रकार, फसल की जरूरतों और पानी की उपलब्धता जैसे कारकों पर विचार करें। मैं आपकी सिंचाई योजना में कैसे सहायता कर सकता हूं?",
            "उचित सिंचाई का समय और मात्रा जल तनाव और जलभराव दोनों को रोकती है। मिट्टी नमी सेंसर और मौसम-आधारित शेड्यूलिंग सिंचाई को अनुकूलित करने में मदद करते हैं। आपके सिंचाई संबंधी क्या प्रश्न हैं?"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Get greeting response
 */
function getGreetingResponse(language) {
    const greetings = {
        en: [
            "Hello! I'm your AgriSmart assistant, ready to help with all your farming questions. How can I assist you today?",
            "Hi there! Welcome to AgriSmart. I'm here to provide agricultural guidance, weather updates, market prices, and more. What would you like to know?",
            "Greetings! I'm here to support your farming journey with expert advice on crops, diseases, weather, and markets. How can I help you today?"
        ],
        hi: [
            "नमस्ते! मैं आपका AgriSmart सहायक हूं, आपके सभी कृषि प्रश्नों में मदद के लिए तैयार हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
            "हैलो! AgriSmart में आपका स्वागत है। मैं यहां कृषि मार्गदर्शन, मौसम अपडेट, बाजार की कीमतें और बहुत कुछ प्रदान करने के लिए हूं। आप क्या जानना चाहते हैं?",
            "प्रणाम! मैं यहां फसलों, बीमारियों, मौसम और बाजारों पर विशेषज्ञ सलाह के साथ आपकी कृषि यात्रा का समर्थन करने के लिए हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
        ]
    };
    
    const langGreetings = greetings[language] || greetings.en;
    return langGreetings[Math.floor(Math.random() * langGreetings.length)];
}

/**
 * Get default response
 */
function getDefaultResponse(message, language) {
    const responses = {
        en: [
            "I understand you're asking about farming. Could you be more specific? I can help with crops, diseases, weather, market prices, soil management, and irrigation.",
            "I'm here to help with agricultural guidance. Please let me know what specific aspect of farming you'd like assistance with - crops, diseases, weather, markets, or something else?",
            "Thanks for your question! I specialize in agricultural support. Could you clarify what farming topic you're interested in? I cover crop management, plant diseases, weather, and market information.",
            "I'm your agricultural assistant and I want to help! Could you provide more details about what farming topic you're asking about?"
        ],
        hi: [
            "मैं समझता हूं कि आप कृषि के बारे में पूछ रहे हैं। क्या आप और अधिक विशिष्ट हो सकते हैं? मैं फसलों, रोगों, मौसम, बाजार की कीमतों, मिट्टी प्रबंधन और सिंचाई के साथ मदद कर सकता हूं।",
            "मैं कृषि मार्गदर्शन के साथ मदद करने के लिए यहां हूं। कृपया मुझे बताएं कि आप कृषि के किस विशिष्ट पहलू में सहायता चाहते हैं - फसलें, रोग, मौसम, बाजार, या कुछ और?",
            "आपके प्रश्न के लिए धन्यवाद! मैं कृषि सहायता में विशेषज्ञता रखता हूं। क्या आप स्पष्ट कर सकते हैं कि आप किस कृषि विषय में रुचि रखते हैं? मैं फसल प्रबंधन, पौधों के रोग, मौसम और बाजार की जानकारी को कवर करता हूं।",
            "मैं आपका कृषि सहायक हूं और मैं मदद करना चाहता हूं! क्या आप इस बारे में अधिक विवरण दे सकते हैं कि आप किस कृषि विषय के बारे में पूछ रहे हैं?"
        ]
    };
    
    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Get suggestion functions
 */
function getAgriculturalSuggestions(language) {
    return language === 'hi' ? [
        'सबसे अच्छी फसल कौन सी है?',
        'फसल रोटेशन के बारे में बताएं',
        'जैविक खेती कैसे करें?'
    ] : [
        'What are the best crops for my region?',
        'Tell me about crop rotation benefits',
        'How to start organic farming?'
    ];
}

function getDiseaseSuggestions(language) {
    return language === 'hi' ? [
        'पौधों के रोग कैसे पहचानें?',
        'कीट नियंत्रण के तरीके',
        'फंगल इन्फेक्शन का इलाज'
    ] : [
        'How to identify plant diseases?',
        'Pest control methods',
        'Treatment for fungal infections'
    ];
}

function getWeatherSuggestions(language) {
    return language === 'hi' ? [
        'आज का मौसम कैसा है?',
        'अगले सप्ताह बारिश होगी?',
        'फसल के लिए मौसम सलाह'
    ] : [
        'What\'s today\'s weather?',
        'Will it rain next week?',
        'Weather advice for crops'
    ];
}

function getMarketSuggestions(language) {
    return language === 'hi' ? [
        'आज के बाजार भाव क्या हैं?',
        'कौन सी फसल का दाम बढ़ रहा है?',
        'बेचने का सही समय कब है?'
    ] : [
        'What are today\'s market prices?',
        'Which crop prices are rising?',
        'When is the right time to sell?'
    ];
}

function getSoilSuggestions(language) {
    return language === 'hi' ? [
        'मिट्टी की जांच कैसे कराएं?',
        'मिट्टी में पोषक तत्व कैसे बढ़ाएं?',
        'सबसे अच्छी खाद कौन सी है?'
    ] : [
        'How to test soil quality?',
        'How to improve soil nutrients?',
        'What is the best fertilizer?'
    ];
}

function getIrrigationSuggestions(language) {
    return language === 'hi' ? [
        'ड्रिप इरीगेशन कैसे लगाएं?',
        'पानी की कमी में क्या करें?',
        'सिंचाई का सही समय क्या है?'
    ] : [
        'How to install drip irrigation?',
        'What to do in water shortage?',
        'What is the right time for irrigation?'
    ];
}

function getGeneralSuggestions(language) {
    return language === 'hi' ? [
        'कृषि के बारे में जानकारी',
        'फसल की बीमारी पहचानें',
        'मौसम की जानकारी'
    ] : [
        'Agricultural information',
        'Identify crop diseases',
        'Weather information'
    ];
}

/**
 * Get chat suggestions by category
 */
function getChatSuggestions(language, category) {
    const suggestionMap = {
        agriculture: getAgriculturalSuggestions,
        disease: getDiseaseSuggestions,
        weather: getWeatherSuggestions,
        market: getMarketSuggestions,
        soil: getSoilSuggestions,
        irrigation: getIrrigationSuggestions
    };
    
    const getSuggestions = suggestionMap[category] || getGeneralSuggestions;
    return getSuggestions(language);
}

/**
 * Mock voice-to-text conversion
 */
async function mockVoiceToText(audioData, language) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock transcriptions based on language
    const mockTranscriptions = {
        en: [
            "What are the best practices for rice cultivation?",
            "How can I identify diseases in my tomato plants?",
            "What is the current weather forecast for farming?",
            "What are today's market prices for wheat?",
            "How should I prepare my soil for the next planting season?"
        ],
        hi: [
            "चावल की खेती के लिए सबसे अच्छे तरीके क्या हैं?",
            "मैं अपने टमाटर के पौधों में रोगों की पहचान कैसे कर सकता हूं?",
            "खेती के लिए वर्तमान मौसम का पूर्वानुमान क्या है?",
            "गेहूं के लिए आज के बाजार भाव क्या हैं?",
            "अगले रोपण सीजन के लिए मुझे अपनी मिट्टी कैसे तैयार करनी चाहिए?"
        ]
    };
    
    const transcriptions = mockTranscriptions[language] || mockTranscriptions.en;
    return transcriptions[Math.floor(Math.random() * transcriptions.length)];
}

/**
 * Generate mock chat history
 */
function generateMockChatHistory(userId, sessionId) {
    const mockHistory = [
        {
            _id: 'msg1',
            userId,
            sessionId: sessionId || 'demo-session-1',
            message: 'What are the best practices for rice cultivation?',
            sender: 'user',
            language: 'en',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
            _id: 'msg2',
            userId,
            sessionId: sessionId || 'demo-session-1',
            message: 'For successful rice cultivation, consider factors like soil type, climate, water availability, and market demand. Key practices include proper seed selection, maintaining water levels, balanced fertilization, and pest management.',
            sender: 'assistant',
            language: 'en',
            timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
            metadata: { category: 'agriculture', confidence: 0.92 }
        },
        {
            _id: 'msg3',
            userId,
            sessionId: sessionId || 'demo-session-1',
            message: 'How often should I irrigate during different growth stages?',
            sender: 'user',
            language: 'en',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        },
        {
            _id: 'msg4',
            userId,
            sessionId: sessionId || 'demo-session-1',
            message: 'Rice irrigation frequency varies by growth stage. During vegetative stage, maintain 2-5 cm water depth. In reproductive stage, ensure continuous flooding. Reduce water during maturity. Monitor soil moisture and adjust based on weather conditions.',
            sender: 'assistant',
            language: 'en',
            timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
            metadata: { category: 'irrigation', confidence: 0.88 }
        }
    ];
    
    return sessionId ? mockHistory.filter(msg => msg.sessionId === sessionId) : mockHistory;
}

module.exports = exports;