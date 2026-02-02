/**
 * Enhanced Routes Configuration
 * Main router configuration connecting all enhanced controllers
 */

const express = require('express');
const { protect } = require('../middleware/auth.middleware');

// Import enhanced controllers
const enhancedAuthController = require('../controllers/enhanced-auth.controller');
const enhancedCropController = require('../controllers/enhanced-crop.controller');
const enhancedDiseaseController = require('../controllers/enhanced-disease.controller');
const enhancedWeatherController = require('../controllers/enhanced-weather.controller');
const enhancedMarketController = require('../controllers/enhanced-market.controller');
const enhancedChatbotController = require('../controllers/enhanced-chatbot.controller');
const enhancedProfileController = require('../controllers/enhanced-profile.controller');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'AgriSmart API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===== AUTHENTICATION ROUTES =====
const authRouter = express.Router();

// Public authentication routes
authRouter.post('/login', enhancedAuthController.login);
authRouter.post('/register', enhancedAuthController.register);
authRouter.post('/verify-otp', enhancedAuthController.verifyOtp);
authRouter.post('/send-otp', enhancedAuthController.sendOtp);
authRouter.post('/refresh-token', enhancedAuthController.refreshToken);
authRouter.post('/reset-password', enhancedAuthController.resetPassword);

// Protected authentication routes
authRouter.use(protect);
authRouter.get('/me', enhancedAuthController.getCurrentUser);
authRouter.post('/logout', enhancedAuthController.logout);
authRouter.post('/change-password', enhancedAuthController.changePassword);

router.use('/auth', authRouter);

// ===== CROP RECOMMENDATION ROUTES =====
const cropRouter = express.Router();
cropRouter.use(protect); // All crop routes require authentication

cropRouter.post('/recommend', enhancedCropController.getCropRecommendation);
cropRouter.get('/history', enhancedCropController.getRecommendationHistory);
cropRouter.post('/save-recommendation', enhancedCropController.saveRecommendation);
cropRouter.get('/list', enhancedCropController.getCropList);

router.use('/crops', cropRouter);

// ===== DISEASE DETECTION ROUTES =====
const diseaseRouter = express.Router();
diseaseRouter.use(protect); // All disease routes require authentication

// Note: File upload middleware would be added here in production
diseaseRouter.post('/analyze', enhancedDiseaseController.analyzeDiseaseImage);
diseaseRouter.get('/history', enhancedDiseaseController.getDetectionHistory);
diseaseRouter.get('/info', enhancedDiseaseController.getDiseaseInfo);
diseaseRouter.get('/:detectionId', enhancedDiseaseController.getDetectionDetails);
diseaseRouter.post('/:detectionId/feedback', enhancedDiseaseController.saveTreatmentFeedback);

router.use('/diseases', diseaseRouter);

// ===== WEATHER ROUTES =====
const weatherRouter = express.Router();
weatherRouter.use(protect); // All weather routes require authentication

weatherRouter.get('/current', enhancedWeatherController.getCurrentWeather);
weatherRouter.get('/forecast', enhancedWeatherController.getWeatherForecast);
weatherRouter.get('/alerts', enhancedWeatherController.getWeatherAlerts);
weatherRouter.get('/advice', enhancedWeatherController.getWeatherAdvice);
weatherRouter.get('/history', enhancedWeatherController.getWeatherHistory);
weatherRouter.post('/alerts/subscribe', enhancedWeatherController.subscribeToAlerts);

router.use('/weather', weatherRouter);

// ===== MARKET PRICE ROUTES =====
const marketRouter = express.Router();
marketRouter.use(protect); // All market routes require authentication

marketRouter.get('/prices', enhancedMarketController.getCurrentPrices);
marketRouter.get('/trends', enhancedMarketController.getPriceTrends);
marketRouter.get('/locations', enhancedMarketController.getMarketLocations);
marketRouter.get('/categories', enhancedMarketController.getCropCategories);
marketRouter.get('/insights', enhancedMarketController.getMarketInsights);

// Price alerts
marketRouter.post('/alerts', enhancedMarketController.addPriceAlert);
marketRouter.get('/alerts', enhancedMarketController.getPriceAlerts);
marketRouter.delete('/alerts/:alertId', enhancedMarketController.deletePriceAlert);

router.use('/market', marketRouter);

// ===== CHATBOT ROUTES =====
const chatRouter = express.Router();
chatRouter.use(protect); // All chat routes require authentication

chatRouter.post('/message', enhancedChatbotController.sendMessage);
chatRouter.get('/history', enhancedChatbotController.getChatHistory);
chatRouter.get('/sessions', enhancedChatbotController.getChatSessions);
chatRouter.get('/suggestions', enhancedChatbotController.getChatSuggestions);
chatRouter.post('/voice', enhancedChatbotController.processVoiceMessage);
chatRouter.delete('/sessions/:sessionId', enhancedChatbotController.clearChatSession);

router.use('/chat', chatRouter);

// ===== PROFILE ROUTES =====
const profileRouter = express.Router();
profileRouter.use(protect); // All profile routes require authentication

profileRouter.get('/', enhancedProfileController.getProfile);
profileRouter.put('/', enhancedProfileController.updateProfile);
profileRouter.delete('/', enhancedProfileController.deleteAccount);

// Avatar management
profileRouter.post('/avatar', enhancedProfileController.updateAvatar);

// Preferences management
profileRouter.get('/preferences', enhancedProfileController.getPreferences);
profileRouter.put('/preferences', enhancedProfileController.updatePreferences);

// Farm details management
profileRouter.get('/farm', enhancedProfileController.getFarmDetails);
profileRouter.put('/farm', enhancedProfileController.updateFarmDetails);

// User statistics
profileRouter.get('/stats', enhancedProfileController.getUserStats);

router.use('/profile', profileRouter);

// ===== SETTINGS ROUTES =====
const settingsRouter = express.Router();
settingsRouter.use(protect);

// Application settings
settingsRouter.get('/app', (req, res) => {
    res.json({
        status: 'success',
        data: {
            settings: {
                supportedLanguages: ['en', 'hi', 'mr', 'te', 'ta', 'kn'],
                supportedThemes: ['light', 'dark', 'auto'],
                supportedUnits: {
                    temperature: ['celsius', 'fahrenheit'],
                    area: ['hectares', 'acres', 'bigha', 'katha'],
                    currency: ['INR', 'USD']
                },
                features: {
                    cropRecommendation: true,
                    diseaseDetection: true,
                    weatherForecast: true,
                    marketPrices: true,
                    chatbot: true,
                    voiceInput: true,
                    offlineMode: false
                },
                limits: {
                    maxImageSize: '5MB',
                    maxChatHistory: 1000,
                    maxRecommendationHistory: 50,
                    maxDiseaseHistory: 30
                }
            }
        },
        message: 'Application settings retrieved successfully'
    });
});

// System information
settingsRouter.get('/system', (req, res) => {
    res.json({
        status: 'success',
        data: {
            system: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                features: {
                    demoMode: !require('mongoose').connection.readyState
                }
            }
        },
        message: 'System information retrieved successfully'
    });
});

router.use('/settings', settingsRouter);

// ===== FALLBACK ROUTES =====

// API documentation route
router.get('/docs', (req, res) => {
    res.json({
        status: 'success',
        data: {
            title: 'AgriSmart API Documentation',
            version: '1.0.0',
            description: 'Comprehensive agricultural assistance API',
            endpoints: {
                authentication: '/api/auth/*',
                crops: '/api/crops/*',
                diseases: '/api/diseases/*',
                weather: '/api/weather/*',
                market: '/api/market/*',
                chat: '/api/chat/*',
                profile: '/api/profile/*',
                settings: '/api/settings/*'
            },
            documentation: 'Visit /api/docs for detailed API documentation'
        },
        message: 'API documentation overview'
    });
});

// Handle undefined API routes
router.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `API endpoint ${req.originalUrl} not found`,
        suggestion: 'Check /api/docs for available endpoints',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;