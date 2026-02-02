/**
 * Enhanced Profile Controller
 * Handles user profile management and settings with full frontend integration
 */

const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get user profile
 * GET /api/profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo mode check
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            const demoProfile = generateDemoProfile(userId);
            
            return successResponse(res, {
                profile: demoProfile
            }, 'Profile retrieved (Demo Mode)');
        }
        
        const user = await User.findById(userId).select('-password -refreshToken -otp -otpExpires');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        return successResponse(res, {
            profile: user.toPublicJSON()
        }, 'Profile retrieved successfully');
        
    } catch (error) {
        logger.error('Get profile error:', error);
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/profile
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;
        
        // Validate update data
        const allowedFields = [
            'name', 'email', 'location', 'farmDetails', 'preferences'
        ];
        
        const updates = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field];
            }
        });
        
        // Validate email format if provided
        if (updates.email && !isValidEmail(updates.email)) {
            return errorResponse(res, 'Invalid email format', 400);
        }
        
        // Validate farm details if provided
        if (updates.farmDetails) {
            const farmValidation = validateFarmDetails(updates.farmDetails);
            if (!farmValidation.isValid) {
                return errorResponse(res, farmValidation.message, 400);
            }
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            const updatedProfile = {
                ...generateDemoProfile(userId),
                ...updates,
                lastModified: new Date().toISOString()
            };
            
            logger.info(`Profile updated for demo user: ${userId}`);
            
            return successResponse(res, {
                profile: updatedProfile
            }, 'Profile updated successfully (Demo Mode)');
        }
        
        // Update user profile
        const user = await User.findByIdAndUpdate(
            userId, 
            { ...updates, lastModified: new Date() },
            { new: true, runValidators: true }
        ).select('-password -refreshToken -otp -otpExpires');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        logger.info(`Profile updated for user: ${userId}`);
        
        return successResponse(res, {
            profile: user.toPublicJSON()
        }, 'Profile updated successfully');
        
    } catch (error) {
        logger.error('Update profile error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return errorResponse(res, messages.join(', '), 400);
        }
        next(error);
    }
};

/**
 * Update profile picture
 * POST /api/profile/avatar
 */
exports.updateAvatar = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Check if image file was uploaded
        if (!req.file && !req.files) {
            return errorResponse(res, 'Profile picture is required', 400);
        }
        
        const imageFile = req.file || (req.files && req.files.avatar);
        
        if (!imageFile) {
            return errorResponse(res, 'Profile picture is required', 400);
        }
        
        // Validate image file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(imageFile.mimetype)) {
            return errorResponse(res, 'Only JPEG and PNG images are allowed', 400);
        }
        
        // Validate file size (2MB limit)
        if (imageFile.size > 2 * 1024 * 1024) {
            return errorResponse(res, 'Image size must be less than 2MB', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            const avatarUrl = `/uploads/avatars/demo-avatar-${Date.now()}.jpg`;
            
            return successResponse(res, {
                avatar: avatarUrl,
                message: 'Profile picture updated successfully (Demo Mode)'
            }, 'Avatar updated');
        }
        
        // Generate unique filename
        const fileExtension = path.extname(imageFile.originalname);
        const fileName = `${userId}-${Date.now()}${fileExtension}`;
        const avatarPath = `/uploads/avatars/${fileName}`;
        
        // Update user avatar path
        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarPath },
            { new: true }
        ).select('avatar');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        logger.info(`Avatar updated for user: ${userId}`);
        
        return successResponse(res, {
            avatar: user.avatar,
            message: 'Profile picture updated successfully'
        }, 'Avatar updated');
        
    } catch (error) {
        logger.error('Update avatar error:', error);
        next(error);
    }
};

/**
 * Get user preferences
 * GET /api/profile/preferences
 */
exports.getPreferences = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            const demoPreferences = {
                language: 'en',
                notifications: {
                    weather: true,
                    market: true,
                    disease: true,
                    general: false
                },
                theme: 'light',
                units: {
                    temperature: 'celsius',
                    area: 'hectares',
                    currency: 'INR'
                },
                privacy: {
                    shareLocation: true,
                    shareProfile: false,
                    allowAnalytics: true
                }
            };
            
            return successResponse(res, {
                preferences: demoPreferences
            }, 'Preferences retrieved (Demo Mode)');
        }
        
        const user = await User.findById(userId).select('preferences');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        return successResponse(res, {
            preferences: user.preferences || {}
        }, 'Preferences retrieved successfully');
        
    } catch (error) {
        logger.error('Get preferences error:', error);
        next(error);
    }
};

/**
 * Update user preferences
 * PUT /api/profile/preferences
 */
exports.updatePreferences = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;
        
        if (!preferences || typeof preferences !== 'object') {
            return errorResponse(res, 'Preferences object is required', 400);
        }
        
        // Validate preferences structure
        const validationResult = validatePreferences(preferences);
        if (!validationResult.isValid) {
            return errorResponse(res, validationResult.message, 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            logger.info(`Preferences updated for demo user: ${userId}`);
            
            return successResponse(res, {
                preferences,
                message: 'Preferences updated successfully (Demo Mode)'
            }, 'Preferences updated');
        }
        
        // Update user preferences
        const user = await User.findByIdAndUpdate(
            userId,
            { preferences },
            { new: true }
        ).select('preferences');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        logger.info(`Preferences updated for user: ${userId}`);
        
        return successResponse(res, {
            preferences: user.preferences,
            message: 'Preferences updated successfully'
        }, 'Preferences updated');
        
    } catch (error) {
        logger.error('Update preferences error:', error);
        next(error);
    }
};

/**
 * Get farm details
 * GET /api/profile/farm
 */
exports.getFarmDetails = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            const demoFarmDetails = {
                area: 5.5,
                unit: 'hectares',
                soilType: 'Loamy',
                crops: ['Rice', 'Wheat', 'Cotton'],
                location: {
                    address: 'Village Ramdaspeth, Akola District, Maharashtra',
                    latitude: 20.7002,
                    longitude: 77.0082,
                    state: 'Maharashtra',
                    district: 'Akola'
                },
                irrigation: {
                    type: 'Drip',
                    source: 'Borewell',
                    capacity: '10000 liters/hour'
                },
                machinery: ['Tractor', 'Harvester', 'Sprayer'],
                lastUpdated: new Date().toISOString()
            };
            
            return successResponse(res, {
                farmDetails: demoFarmDetails
            }, 'Farm details retrieved (Demo Mode)');
        }
        
        const user = await User.findById(userId).select('farmDetails');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        return successResponse(res, {
            farmDetails: user.farmDetails || {}
        }, 'Farm details retrieved successfully');
        
    } catch (error) {
        logger.error('Get farm details error:', error);
        next(error);
    }
};

/**
 * Update farm details
 * PUT /api/profile/farm
 */
exports.updateFarmDetails = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { farmDetails } = req.body;
        
        if (!farmDetails || typeof farmDetails !== 'object') {
            return errorResponse(res, 'Farm details object is required', 400);
        }
        
        // Validate farm details
        const validationResult = validateFarmDetails(farmDetails);
        if (!validationResult.isValid) {
            return errorResponse(res, validationResult.message, 400);
        }
        
        // Add timestamp
        farmDetails.lastUpdated = new Date();
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            logger.info(`Farm details updated for demo user: ${userId}`);
            
            return successResponse(res, {
                farmDetails,
                message: 'Farm details updated successfully (Demo Mode)'
            }, 'Farm details updated');
        }
        
        // Update farm details
        const user = await User.findByIdAndUpdate(
            userId,
            { farmDetails },
            { new: true }
        ).select('farmDetails');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        logger.info(`Farm details updated for user: ${userId}`);
        
        return successResponse(res, {
            farmDetails: user.farmDetails,
            message: 'Farm details updated successfully'
        }, 'Farm details updated');
        
    } catch (error) {
        logger.error('Update farm details error:', error);
        next(error);
    }
};

/**
 * Get user statistics
 * GET /api/profile/stats
 */
exports.getUserStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo mode or generate mock stats
        const stats = await generateUserStats(userId);
        
        return successResponse(res, {
            stats
        }, 'User statistics retrieved successfully');
        
    } catch (error) {
        logger.error('Get user stats error:', error);
        next(error);
    }
};

/**
 * Delete user account
 * DELETE /api/profile
 */
exports.deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { confirmPassword } = req.body;
        
        if (!confirmPassword) {
            return errorResponse(res, 'Password confirmation is required', 400);
        }
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode || userId.toString().startsWith('demo-user-')) {
            logger.info(`Demo account deletion requested for user: ${userId}`);
            
            return successResponse(res, {
                message: 'Account deletion processed (Demo Mode)'
            }, 'Account deleted');
        }
        
        // Verify password
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        
        const isMatch = await user.comparePassword(confirmPassword);
        if (!isMatch) {
            return errorResponse(res, 'Invalid password', 401);
        }
        
        // Soft delete (deactivate account)
        await User.findByIdAndUpdate(userId, { 
            isActive: false,
            deactivatedAt: new Date()
        });
        
        logger.info(`Account deactivated for user: ${userId}`);
        
        return successResponse(res, {
            message: 'Account has been deactivated successfully'
        }, 'Account deleted');
        
    } catch (error) {
        logger.error('Delete account error:', error);
        next(error);
    }
};

/**
 * Generate demo profile
 */
function generateDemoProfile(userId) {
    return {
        id: userId,
        name: 'Demo Farmer',
        phone: '9876543210',
        email: 'demo@agrismart.com',
        location: 'Akola, Maharashtra, India',
        avatar: null,
        farmDetails: {
            area: 5.5,
            unit: 'hectares',
            soilType: 'Loamy',
            crops: ['Rice', 'Wheat', 'Cotton'],
            location: {
                latitude: 20.7002,
                longitude: 77.0082,
                state: 'Maharashtra',
                district: 'Akola'
            },
            lastUpdated: new Date().toISOString()
        },
        preferences: {
            language: 'en',
            notifications: {
                weather: true,
                market: true,
                disease: true,
                general: false
            },
            theme: 'light',
            units: {
                temperature: 'celsius',
                area: 'hectares',
                currency: 'INR'
            }
        },
        isVerified: true,
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastLogin: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate farm details
 */
function validateFarmDetails(farmDetails) {
    if (farmDetails.area && (isNaN(farmDetails.area) || farmDetails.area <= 0)) {
        return { isValid: false, message: 'Farm area must be a positive number' };
    }
    
    if (farmDetails.unit && !['hectares', 'acres', 'bigha', 'katha'].includes(farmDetails.unit)) {
        return { isValid: false, message: 'Invalid unit. Allowed: hectares, acres, bigha, katha' };
    }
    
    if (farmDetails.crops && !Array.isArray(farmDetails.crops)) {
        return { isValid: false, message: 'Crops must be an array' };
    }
    
    if (farmDetails.location) {
        const { latitude, longitude } = farmDetails.location;
        if (latitude && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
            return { isValid: false, message: 'Invalid latitude' };
        }
        if (longitude && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
            return { isValid: false, message: 'Invalid longitude' };
        }
    }
    
    return { isValid: true };
}

/**
 * Validate preferences
 */
function validatePreferences(preferences) {
    if (preferences.language && !['en', 'hi', 'mr', 'te', 'ta', 'kn'].includes(preferences.language)) {
        return { isValid: false, message: 'Unsupported language' };
    }
    
    if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
        return { isValid: false, message: 'Invalid theme. Allowed: light, dark, auto' };
    }
    
    if (preferences.units) {
        const { temperature, area, currency } = preferences.units;
        
        if (temperature && !['celsius', 'fahrenheit'].includes(temperature)) {
            return { isValid: false, message: 'Invalid temperature unit' };
        }
        
        if (area && !['hectares', 'acres'].includes(area)) {
            return { isValid: false, message: 'Invalid area unit' };
        }
        
        if (currency && !['INR', 'USD'].includes(currency)) {
            return { isValid: false, message: 'Invalid currency' };
        }
    }
    
    return { isValid: true };
}

/**
 * Generate user statistics
 */
async function generateUserStats(userId) {
    // Mock statistics for demo
    return {
        profile: {
            completeness: 85,
            lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        activity: {
            loginCount: 42,
            lastLogin: new Date().toISOString(),
            sessionsThisMonth: 15,
            avgSessionDuration: '12 minutes'
        },
        usage: {
            totalQueries: 156,
            favoriteFunctions: [
                { name: 'Weather Forecast', count: 45 },
                { name: 'Market Prices', count: 38 },
                { name: 'Disease Detection', count: 32 },
                { name: 'Crop Recommendation', count: 25 },
                { name: 'Chatbot', count: 16 }
            ]
        },
        farming: {
            totalCrops: 3,
            farmArea: 5.5,
            recommendationsReceived: 23,
            diseaseDetections: 8,
            marketAlerts: 12
        },
        achievements: [
            {
                title: 'Early Adopter',
                description: 'Joined AgriSmart in the first month',
                earnedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                icon: '🌟'
            },
            {
                title: 'Active Farmer',
                description: 'Used the app for 30 consecutive days',
                earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                icon: '📱'
            },
            {
                title: 'Knowledge Seeker',
                description: 'Asked 100+ questions to the chatbot',
                earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                icon: '💭'
            }
        ]
    };
}

module.exports = exports;