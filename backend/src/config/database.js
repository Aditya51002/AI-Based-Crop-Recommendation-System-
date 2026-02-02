/**
 * MongoDB Database Connection
 */

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Set a connection timeout
        mongoose.set('bufferTimeoutMS', 5000);
        
        const conn = await mongoose.connect(config.mongodb.uri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s
            socketTimeoutMS: 10000
        });
        
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
        
        return conn;
    } catch (error) {
        logger.warn('MongoDB connection failed:', error.message);
        
        // In development, continue without DB (use mock data)
        if (config.nodeEnv === 'development') {
            logger.warn('⚠️ Running without MongoDB - API will work with mock data');
            return null;
        }
        
        process.exit(1);
    }
};

module.exports = connectDB;
