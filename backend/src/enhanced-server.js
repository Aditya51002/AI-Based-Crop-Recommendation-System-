/**
 * Enhanced AgriSmart Server
 * Main server configuration with full-stack integration support
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import configurations and middleware
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, AppError } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import enhanced routes
const enhancedApiRoutes = require('./routes/enhanced-api.routes');

// Import original routes as fallback - commented out for now
// const authRoutes = require('./routes/auth.routes');
// const cropRoutes = require('./routes/crop.routes');
// const diseaseRoutes = require('./routes/disease.routes');
// const weatherRoutes = require('./routes/weather.routes');
// const marketRoutes = require('./routes/market.routes');
// const chatbotRoutes = require('./routes/chatbot.routes');
// const profileRoutes = require('./routes/profile.routes');
// const settingsRoutes = require('./routes/settings.routes');

const app = express();

// ===== SECURITY AND PERFORMANCE MIDDLEWARE =====

// Enable trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for development
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression({
    level: 6,
    threshold: 1000,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    }
});

// ===== CORS CONFIGURATION =====

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080',
            'file://', // For mobile app webview
        ];
        
        // In production, add specific domains
        if (process.env.NODE_ENV === 'production') {
            allowedOrigins.push(
                process.env.FRONTEND_URL,
                process.env.MOBILE_APP_URL
            );
        } else {
            // In development, allow all localhost origins
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// ===== BODY PARSING MIDDLEWARE =====

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// ===== REQUEST LOGGING =====

app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel](`${req.method} ${req.originalUrl}`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id || 'anonymous'
        });
    });
    
    next();
});

// ===== STATIC FILES SERVING =====

// Serve uploaded files
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    fs.mkdirSync(path.join(uploadsPath, 'avatars'), { recursive: true });
    fs.mkdirSync(path.join(uploadsPath, 'diseases'), { recursive: true });
}

app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Serve web application files
const webAppPath = path.join(__dirname, '..', '..', 'web-app');
if (fs.existsSync(webAppPath)) {
    app.use('/app', express.static(webAppPath, {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
        etag: true,
        index: 'index.html'
    }));
    
    logger.info('Serving web application from /app');
}

// ===== API ROUTES =====

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API documentation landing
app.get('/api', (req, res) => {
    res.json({
        status: 'success',
        message: 'Welcome to AgriSmart API',
        version: '1.0.0',
        documentation: {
            endpoints: '/api/docs',
            health: '/health',
            webapp: '/app'
        },
        timestamp: new Date().toISOString()
    });
});

// Enhanced API routes (primary)
app.use('/api', enhancedApiRoutes);

// Original API routes (fallback with prefix) - commented out for now
// app.use('/api/v1/auth', authLimiter, authRoutes);
// app.use('/api/v1/crops', cropRoutes);
// app.use('/api/v1/diseases', diseaseRoutes);
// app.use('/api/v1/weather', weatherRoutes);
// app.use('/api/v1/market', marketRoutes);
// app.use('/api/v1/chatbot', chatbotRoutes);
// app.use('/api/v1/profile', profileRoutes);
// app.use('/api/v1/settings', settingsRoutes);

// ===== WEB APPLICATION ROUTES =====

// Serve web app for any non-API routes
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return next();
    }
    
    const webAppIndexPath = path.join(webAppPath, 'index.html');
    if (fs.existsSync(webAppIndexPath)) {
        res.sendFile(webAppIndexPath);
    } else {
        next();
    }
});

// ===== ERROR HANDLING =====

// Handle 404 for API routes
app.use('/api/*', notFound);

// Global error handler
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// ===== GRACEFUL SHUTDOWN =====

const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
        if (err) {
            logger.error('Error during server shutdown:', err);
            process.exit(1);
        }
        
        logger.info('Server closed successfully');
        
        // Close database connection
        require('mongoose').connection.close((err) => {
            if (err) {
                logger.error('Error closing database connection:', err);
            } else {
                logger.info('Database connection closed');
            }
            process.exit(0);
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== START SERVER =====

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    logger.info(`🚀 AgriSmart Server running on http://${HOST}:${PORT}`);
    logger.info(`📱 Web App available at: http://${HOST}:${PORT}/app`);
    logger.info(`📊 API Documentation: http://${HOST}:${PORT}/api/docs`);
    logger.info(`💚 Health Check: http://${HOST}:${PORT}/health`);
    logger.info(`🌾 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Display available routes
    logger.info('📍 Available API Routes:');
    logger.info('  🔐 Authentication: /api/auth/*');
    logger.info('  🌾 Crops: /api/crops/*');
    logger.info('  🦠 Disease Detection: /api/diseases/*');
    logger.info('  ☁️ Weather: /api/weather/*');
    logger.info('  💰 Market Prices: /api/market/*');
    logger.info('  💬 Chatbot: /api/chat/*');
    logger.info('  👤 Profile: /api/profile/*');
    logger.info('  ⚙️ Settings: /api/settings/*');
});

// Export for testing
module.exports = { app, server };