/**
 * Application Configuration
 * Centralizes all environment variables and config
 */

require('dotenv').config();

const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    host: process.env.HOST || 'localhost',
    
    // MongoDB
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agrismart'
    },
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'agrismart-default-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },
    
    // OTP
    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
        length: parseInt(process.env.OTP_LENGTH, 10) || 6
    },
    
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',') 
            : ['http://localhost:3000', 'http://127.0.0.1:5500', '*']
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
    },
    
    // File Upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
        uploadDir: process.env.UPLOAD_DIR || 'uploads'
    },
    
    // External APIs
    externalApis: {
        openWeather: process.env.OPENWEATHER_API_KEY,
        agmarket: process.env.AGMARKET_API_KEY
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log'
    }
};

module.exports = config;
