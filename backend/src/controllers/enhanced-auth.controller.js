/**
 * Enhanced Authentication Controller
 * Handles login, registration, OTP, and token management with full frontend integration
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
        
        // Validate input
        if (!phone || !password) {
            return errorResponse(res, 'Phone number and password are required', 400);
        }
        
        // Demo mode: Accept any credentials when MongoDB is not connected
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            // Create demo user response that matches frontend expectations
            const demoUser = {
                id: 'demo-user-' + Date.now(),
                name: 'Demo User',
                phone: phone,
                email: 'demo@agrismart.com',
                location: 'Maharashtra, India',
                avatar: null,
                farmDetails: {
                    area: 5.5,
                    unit: 'hectares',
                    soilType: 'Loamy',
                    crops: ['Rice', 'Wheat', 'Cotton'],
                    latitude: 19.0760,
                    longitude: 72.8777
                },
                preferences: {
                    language: 'en',
                    notifications: true,
                    theme: 'light',
                    units: 'metric'
                },
                isVerified: true,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
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
            return errorResponse(res, 'Invalid phone number or password', 401);
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return errorResponse(res, 'Invalid phone number or password', 401);
        }
        
        // Check if user is active
        if (!user.isActive) {
            return errorResponse(res, 'Account is deactivated. Please contact support.', 401);
        }
        
        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        // Update user's refresh token and last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });
        
        // Log the login
        try {
            await History.addEntry(user._id, 'login', { 
                timestamp: new Date() 
            }, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (historyError) {
            logger.warn('Failed to log login history:', historyError);
        }
        
        logger.info(`User logged in: ${user.phone}`);
        
        return successResponse(res, {
            user: user.toPublicJSON(),
            token,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }, 'Login successful');
        
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
};

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { name, phone, password, email, location, confirmPassword } = req.body;
        
        // Validate input
        if (!name || !phone || !password) {
            return errorResponse(res, 'Name, phone number, and password are required', 400);
        }
        
        if (password !== confirmPassword) {
            return errorResponse(res, 'Password and confirm password do not match', 400);
        }
        
        if (password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }
        
        // Validate phone number format (basic validation)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return errorResponse(res, 'Please enter a valid 10-digit phone number', 400);
        }
        
        // Demo mode handling
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            // Create demo user response
            const demoUser = {
                id: 'demo-user-' + Date.now(),
                name: name,
                phone: phone,
                email: email || `demo_${phone}@agrismart.com`,
                location: location || 'India',
                avatar: null,
                farmDetails: {
                    area: 0,
                    unit: 'hectares',
                    soilType: '',
                    crops: [],
                    latitude: null,
                    longitude: null
                },
                preferences: {
                    language: 'en',
                    notifications: true,
                    theme: 'light',
                    units: 'metric'
                },
                isVerified: false,
                isActive: true,
                createdAt: new Date().toISOString()
            };
            
            const token = generateToken(demoUser.id);
            const refreshToken = generateRefreshToken(demoUser.id);
            
            logger.info(`Demo registration: ${phone}`);
            
            return successResponse(res, {
                user: demoUser,
                token,
                refreshToken,
                otp: '123456',
                message: 'Registration successful (Demo Mode). Use OTP: 123456 to verify.'
            }, 'Registration successful', 201);
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return errorResponse(res, 'Phone number already registered', 409);
        }
        
        // Check if email exists (if provided)
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return errorResponse(res, 'Email already registered', 409);
            }
        }
        
        // Create new user
        const user = await User.create({
            name: name.trim(),
            phone,
            password,
            email: email || null,
            location: location || 'India'
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
            message: process.env.NODE_ENV === 'development' ? 
                `Registration successful. OTP: ${otp}` : 
                'Registration successful. OTP sent to your phone number.'
        }, 'Registration successful', 201);
        
    } catch (error) {
        logger.error('Registration error:', error);
        if (error.code === 11000) {
            return errorResponse(res, 'Phone number or email already exists', 409);
        }
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
        
        if (!phone || !otp) {
            return errorResponse(res, 'Phone number and OTP are required', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            if (otp === '123456') {
                return successResponse(res, {
                    verified: true,
                    message: 'Phone number verified successfully (Demo Mode)'
                }, 'OTP verified');
            } else {
                return errorResponse(res, 'Invalid OTP. Use 123456 for demo.', 400);
            }
        }
        
        const user = await User.findOne({ phone });
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        // Verify OTP
        const isValid = user.verifyOTP(otp);
        if (!isValid) {
            return errorResponse(res, 'Invalid or expired OTP', 400);
        }
        
        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        logger.info(`OTP verified for user: ${phone}`);
        
        return successResponse(res, {
            verified: true,
            user: user.toPublicJSON()
        }, 'Phone number verified successfully');
        
    } catch (error) {
        logger.error('OTP verification error:', error);
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
            return errorResponse(res, 'Phone number is required', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            return successResponse(res, {
                message: 'OTP sent successfully (Demo Mode)',
                otp: '123456'
            }, 'OTP sent');
        }
        
        const user = await User.findOne({ phone });
        if (!user) {
            return errorResponse(res, 'User not found', 404);
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
        logger.error('Send OTP error:', error);
        next(error);
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (!isDemoMode) {
            // Clear refresh token from database
            await User.findByIdAndUpdate(userId, { 
                $unset: { refreshToken: 1 } 
            });
            
            // Log the logout
            try {
                await History.addEntry(userId, 'logout', { 
                    timestamp: new Date() 
                }, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            } catch (historyError) {
                logger.warn('Failed to log logout history:', historyError);
            }
        }
        
        logger.info(`User logged out: ${userId}`);
        
        return successResponse(res, {
            message: 'Logged out successfully'
        }, 'Logout successful');
        
    } catch (error) {
        logger.error('Logout error:', error);
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            const demoUser = {
                id: userId,
                name: 'Demo User',
                phone: '9876543210',
                email: 'demo@agrismart.com',
                location: 'Maharashtra, India',
                avatar: null,
                farmDetails: {
                    area: 5.5,
                    unit: 'hectares',
                    soilType: 'Loamy',
                    crops: ['Rice', 'Wheat', 'Cotton'],
                    latitude: 19.0760,
                    longitude: 72.8777
                },
                preferences: {
                    language: 'en',
                    notifications: true,
                    theme: 'light',
                    units: 'metric'
                },
                isVerified: true,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            return successResponse(res, {
                user: demoUser
            }, 'User profile retrieved (Demo Mode)');
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        return successResponse(res, {
            user: user.toPublicJSON()
        }, 'User profile retrieved successfully');
        
    } catch (error) {
        logger.error('Get current user error:', error);
        next(error);
    }
};

/**
 * Refresh authentication token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return errorResponse(res, 'Refresh token is required', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const newToken = generateToken('demo-user-' + Date.now());
            const newRefreshToken = generateRefreshToken('demo-user-' + Date.now());
            
            return successResponse(res, {
                token: newToken,
                refreshToken: newRefreshToken,
                expiresIn: '7d'
            }, 'Token refreshed (Demo Mode)');
        }
        
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            return errorResponse(res, 'Invalid refresh token', 401);
        }
        
        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);
        
        // Update refresh token in database
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });
        
        logger.info(`Token refreshed for user: ${user._id}`);
        
        return successResponse(res, {
            token: newToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }, 'Token refreshed successfully');
        
    } catch (error) {
        logger.error('Token refresh error:', error);
        return errorResponse(res, 'Invalid or expired refresh token', 401);
    }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return errorResponse(res, 'All password fields are required', 400);
        }
        
        if (newPassword !== confirmPassword) {
            return errorResponse(res, 'New password and confirm password do not match', 400);
        }
        
        if (newPassword.length < 6) {
            return errorResponse(res, 'New password must be at least 6 characters long', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            return successResponse(res, {
                message: 'Password changed successfully (Demo Mode)'
            }, 'Password changed');
        }
        
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return errorResponse(res, 'Current password is incorrect', 400);
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        logger.info(`Password changed for user: ${userId}`);
        
        return successResponse(res, {
            message: 'Password changed successfully'
        }, 'Password changed');
        
    } catch (error) {
        logger.error('Change password error:', error);
        next(error);
    }
};

/**
 * Reset password (forgot password)
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { phone, otp, newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!phone || !otp || !newPassword || !confirmPassword) {
            return errorResponse(res, 'All fields are required', 400);
        }
        
        if (newPassword !== confirmPassword) {
            return errorResponse(res, 'Password and confirm password do not match', 400);
        }
        
        if (newPassword.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            if (otp === '123456') {
                return successResponse(res, {
                    message: 'Password reset successfully (Demo Mode)'
                }, 'Password reset');
            } else {
                return errorResponse(res, 'Invalid OTP. Use 123456 for demo.', 400);
            }
        }
        
        const user = await User.findOne({ phone }).select('+password');
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        // Verify OTP
        const isValid = user.verifyOTP(otp);
        if (!isValid) {
            return errorResponse(res, 'Invalid or expired OTP', 400);
        }
        
        // Update password
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        
        logger.info(`Password reset for user: ${phone}`);
        
        return successResponse(res, {
            message: 'Password reset successfully'
        }, 'Password reset');
        
    } catch (error) {
        logger.error('Reset password error:', error);
        next(error);
    }
};

module.exports = exports;