/**
 * AgriSmart Backend Server
 * Main entry point for the Express application
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const cropRoutes = require('./routes/crop.routes');
const diseaseRoutes = require('./routes/disease.routes');
const weatherRoutes = require('./routes/weather.routes');
const marketRoutes = require('./routes/market.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Initialize Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: message => logger.info(message.trim()) }
    }));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve web application static files
app.use('/app', express.static(path.join(__dirname, '../../web-app')));

// Serve web application from root path
app.use('/', express.static(path.join(__dirname, '../../web-app')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AgriSmart API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crop-recommendation', cropRoutes);
app.use('/api/disease-detection', diseaseRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/market-prices', marketRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to AgriSmart API',
        version: '1.0.0',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                verifyOtp: 'POST /api/auth/verify-otp',
                refreshToken: 'POST /api/auth/refresh-token'
            },
            cropRecommendation: {
                recommend: 'POST /api/crop-recommendation'
            },
            diseaseDetection: {
                detect: 'POST /api/disease-detection'
            },
            weather: {
                get: 'GET /api/weather?location={location}'
            },
            marketPrices: {
                get: 'GET /api/market-prices?crop={crop}'
            },
            chatbot: {
                send: 'POST /api/chatbot'
            },
            profile: {
                get: 'GET /api/profile',
                update: 'PUT /api/profile'
            },
            settings: {
                get: 'GET /api/settings',
                update: 'PUT /api/settings'
            }
        }
    });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        const PORT = config.port;
        const HOST = config.host;
        
        app.listen(PORT, HOST, () => {
            logger.info(`🚀 AgriSmart Backend Server running on http://${HOST}:${PORT}`);
            logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api`);
            logger.info(`🔧 Environment: ${config.nodeEnv}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

startServer();

module.exports = app;
