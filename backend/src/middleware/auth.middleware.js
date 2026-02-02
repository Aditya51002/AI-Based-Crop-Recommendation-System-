/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
    try {
        let token;
        
        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        // Check if token exists
        if (!token) {
            return next(new AppError('Please login to access this resource', 401, 'UNAUTHORIZED'));
        }
        
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('User no longer exists', 401, 'USER_NOT_FOUND'));
        }
        
        // Check if user is active
        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated', 401, 'ACCOUNT_DEACTIVATED'));
        }
        
        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please login again', 401, 'INVALID_TOKEN'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired. Please login again', 401, 'TOKEN_EXPIRED'));
        }
        next(error);
    }
};

/**
 * Optional authentication - attach user if token present
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (token) {
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findById(decoded.id);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Token invalid, but continue without user
        next();
    }
};

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwt.refreshSecret);
};

module.exports = {
    protect,
    optionalAuth,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken
};
