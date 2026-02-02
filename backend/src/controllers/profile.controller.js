/**
 * Profile Controller
 * User profile management
 */

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const History = require('../models/History');
const { AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get user profile
 * GET /api/profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }
        
        // Get activity statistics
        const activityStats = await History.aggregate([
            { $match: { userId: user._id } },
            { $group: {
                _id: '$type',
                count: { $sum: 1 }
            }}
        ]);
        
        const stats = {
            cropRecommendations: 0,
            diseaseDetections: 0,
            weatherChecks: 0,
            chatbotQueries: 0
        };
        
        activityStats.forEach(stat => {
            switch (stat._id) {
                case 'crop-recommendation':
                    stats.cropRecommendations = stat.count;
                    break;
                case 'disease-detection':
                    stats.diseaseDetections = stat.count;
                    break;
                case 'weather-check':
                    stats.weatherChecks = stat.count;
                    break;
                case 'chatbot':
                    stats.chatbotQueries = stat.count;
                    break;
            }
        });
        
        return successResponse(res, {
            user: user.toPublicJSON(),
            stats
        }, 'Profile retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/profile
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'email', 'location', 'coordinates'];
        const updates = {};
        
        // Filter allowed fields
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        
        // Log the update
        await History.addEntry(req.user._id, 'profile-update', {
            updatedFields: Object.keys(updates)
        });
        
        logger.info(`Profile updated for user: ${user.phone}`);
        
        return successResponse(res, {
            user: user.toPublicJSON()
        }, 'Profile updated successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Upload avatar
 * POST /api/profile/avatar
 */
exports.uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload an image', 400, 'IMAGE_REQUIRED'));
        }
        
        // Delete old avatar if exists
        if (req.user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(req.user.avatar));
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        // Update user with new avatar
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: avatarUrl },
            { new: true }
        );
        
        logger.info(`Avatar uploaded for user: ${user.phone}`);
        
        return successResponse(res, {
            avatar: avatarUrl,
            user: user.toPublicJSON()
        }, 'Avatar uploaded successfully');
        
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) logger.error('Error deleting file:', err);
            });
        }
        next(error);
    }
};

/**
 * Delete avatar
 * DELETE /api/profile/avatar
 */
exports.deleteAvatar = async (req, res, next) => {
    try {
        if (req.user.avatar) {
            const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(req.user.avatar));
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: null },
            { new: true }
        );
        
        logger.info(`Avatar deleted for user: ${user.phone}`);
        
        return successResponse(res, {
            user: user.toPublicJSON()
        }, 'Avatar deleted successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Update farm details
 * PUT /api/profile/farm
 */
exports.updateFarmDetails = async (req, res, next) => {
    try {
        const { area, unit, soilType, irrigationType, crops } = req.body;
        
        const farmDetails = {
            ...(area !== undefined && { area }),
            ...(unit && { unit }),
            ...(soilType && { soilType }),
            ...(irrigationType && { irrigationType }),
            ...(crops && { crops })
        };
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { farmDetails } },
            { new: true }
        );
        
        logger.info(`Farm details updated for user: ${user.phone}`);
        
        return successResponse(res, {
            farmDetails: user.farmDetails,
            user: user.toPublicJSON()
        }, 'Farm details updated successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Change password
 * PUT /api/profile/password
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return next(new AppError('Current and new password are required', 400, 'MISSING_FIELDS'));
        }
        
        if (newPassword.length < 6) {
            return next(new AppError('New password must be at least 6 characters', 400, 'WEAK_PASSWORD'));
        }
        
        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return next(new AppError('Current password is incorrect', 401, 'WRONG_PASSWORD'));
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        logger.info(`Password changed for user: ${user.phone}`);
        
        return successResponse(res, null, 'Password changed successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Delete account
 * DELETE /api/profile
 */
exports.deleteAccount = async (req, res, next) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return next(new AppError('Password is required to delete account', 400, 'PASSWORD_REQUIRED'));
        }
        
        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        
        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new AppError('Password is incorrect', 401, 'WRONG_PASSWORD'));
        }
        
        // Delete avatar if exists
        if (user.avatar) {
            const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }
        
        // Delete user history
        await History.deleteMany({ userId: user._id });
        
        // Delete user
        await User.findByIdAndDelete(user._id);
        
        logger.info(`Account deleted: ${user.phone}`);
        
        return successResponse(res, null, 'Account deleted successfully');
        
    } catch (error) {
        next(error);
    }
};
