/**
 * Authentication Controller
 * Handles login, registration, OTP, and token management
 */

const User = require('../models/User');
const History = require('../models/History');
const { AppError } = require('../middleware/errorHandler');
const { 
    generateToken, 
    generateRefreshToken, 
    verifyRefreshToken 
} = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { phone, password } = req.body;
        
        // Demo mode: Accept any credentials when MongoDB is not connected
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            // Create demo user response
            const demoUser = {
                id: 'demo-user-' + Date.now(),
                name: 'Demo User',
                phone: phone,
                email: 'demo@agrismart.com',
                location: 'India',
                farmDetails: {
                    area: 5,
                    unit: 'hectares',
                    soilType: 'Loamy',
                    crops: ['Rice', 'Wheat']
                },
                preferences: {
                    language: 'en',
                    notifications: true,
                    theme: 'light'
                },
                createdAt: new Date().toISOString()
            };
            
            const token = generateToken(demoUser.id);
            const refreshToken = generateRefreshToken(demoUser.id);
            
            logger.info(`Demo login: ${phone}`);
            
            return successResponse(res, {
                user: demoUser,
                token,
                refreshToken,
                expiresIn: '7d',
                demoMode: true
            }, 'Login successful (Demo Mode)');
        }
        
        // Find user with password field
        const user = await User.findOne({ phone }).select('+password');
        
        if (!user) {
            return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
        }
        
        // Check if user is active
        if (!user.isActive) {
            return next(new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED'));
        }
        
        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        // Update user's refresh token and last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });
        
        // Log the login
        await History.addEntry(user._id, 'login', { 
            timestamp: new Date() 
        }, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        logger.info(`User logged in: ${user.phone}`);
        
        return successResponse(res, {
            user: user.toPublicJSON(),
            token,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }, 'Login successful');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { name, phone, password, email, location } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return next(new AppError('Phone number already registered', 409, 'PHONE_EXISTS'));
        }
        
        // Create new user
        const user = await User.create({
            name,
            phone,
            password,
            email,
            location
        });
        
        // Generate OTP for verification
        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });
        
        // In production, send OTP via SMS
        // For demo, we'll just log it
        logger.info(`OTP for ${phone}: ${otp}`);
        
        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        
        logger.info(`New user registered: ${phone}`);
        
        return successResponse(res, {
            user: user.toPublicJSON(),
            token,
            refreshToken,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
            message: 'OTP sent to your phone'
        }, 'Registration successful', 201);
        
    } catch (error) {
        next(error);
    }
};

/**
 * Send OTP
 * POST /api/auth/send-otp
 */
exports.sendOtp = async (req, res, next) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return next(new AppError('Phone number is required', 400, 'PHONE_REQUIRED'));
        }
        
        const user = await User.findOne({ phone });
        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }
        
        // Generate OTP
        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });
        
        // In production, send OTP via SMS service
        logger.info(`OTP sent to ${phone}: ${otp}`);
        
        return successResponse(res, {
            message: 'OTP sent successfully',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }, 'OTP sent');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;
        
        const user = await User.findOne({ phone });
        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }
        
        const isValid = user.verifyOTP(otp);
        if (!isValid) {
            return next(new AppError('Invalid or expired OTP', 400, 'INVALID_OTP'));
        }
        
        await user.save({ validateBeforeSave: false });
        
        logger.info(`OTP verified for ${phone}`);
        
        return successResponse(res, {
            verified: true
        }, 'OTP verified successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return next(new AppError('Refresh token is required', 400, 'TOKEN_REQUIRED'));
        }
        
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // Find user with refresh token
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            return next(new AppError('Invalid refresh token', 401, 'INVALID_TOKEN'));
        }
        
        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);
        
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });
        
        return successResponse(res, {
            token: newToken,
            refreshToken: newRefreshToken
        }, 'Token refreshed');
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Refresh token expired. Please login again', 401, 'TOKEN_EXPIRED'));
        }
        next(error);
    }
};

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return next(new AppError('Phone number is required', 400, 'PHONE_REQUIRED'));
        }
        
        const user = await User.findOne({ phone });
        if (!user) {
            // Don't reveal if user exists
            return successResponse(res, null, 'If the phone number is registered, you will receive an OTP');
        }
        
        // Generate OTP for password reset
        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });
        
        logger.info(`Password reset OTP for ${phone}: ${otp}`);
        
        return successResponse(res, {
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }, 'If the phone number is registered, you will receive an OTP');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { phone, otp, newPassword } = req.body;
        
        if (!phone || !otp || !newPassword) {
            return next(new AppError('Phone, OTP, and new password are required', 400, 'MISSING_FIELDS'));
        }
        
        const user = await User.findOne({ phone });
        if (!user) {
            return next(new AppError('Invalid request', 400, 'INVALID_REQUEST'));
        }
        
        // Verify OTP
        const isValid = user.verifyOTP(otp);
        if (!isValid) {
            return next(new AppError('Invalid or expired OTP', 400, 'INVALID_OTP'));
        }
        
        // Update password
        user.password = newPassword;
        user.otp = undefined;
        await user.save();
        
        logger.info(`Password reset for ${phone}`);
        
        return successResponse(res, null, 'Password reset successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Logout
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
    try {
        // Clear refresh token
        req.user.refreshToken = undefined;
        await req.user.save({ validateBeforeSave: false });
        
        logger.info(`User logged out: ${req.user.phone}`);
        
        return successResponse(res, null, 'Logged out successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
    try {
        return successResponse(res, {
            user: req.user.toPublicJSON()
        }, 'User retrieved');
        
    } catch (error) {
        next(error);
    }
};
