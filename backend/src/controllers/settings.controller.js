/**
 * Settings Controller
 * User preferences and app settings
 */

const User = require('../models/User');
const History = require('../models/History');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Default settings
const defaultSettings = {
    language: 'en',
    notifications: true,
    units: 'metric',
    theme: 'light',
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    weatherAlerts: true,
    priceAlerts: true,
    cropReminders: true
};

/**
 * Get user settings
 * GET /api/settings
 */
exports.getSettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Merge default settings with user preferences
        const settings = {
            ...defaultSettings,
            ...user.preferences
        };
        
        return successResponse(res, {
            settings,
            availableLanguages: [
                { code: 'en', name: 'English' },
                { code: 'hi', name: 'हिन्दी (Hindi)' },
                { code: 'mr', name: 'मराठी (Marathi)' },
                { code: 'ta', name: 'தமிழ் (Tamil)' },
                { code: 'te', name: 'తెలుగు (Telugu)' },
                { code: 'bn', name: 'বাংলা (Bengali)' },
                { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
                { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
                { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' }
            ],
            availableThemes: ['light', 'dark', 'auto'],
            availableUnits: ['metric', 'imperial']
        }, 'Settings retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Update user settings
 * PUT /api/settings
 */
exports.updateSettings = async (req, res, next) => {
    try {
        const allowedSettings = [
            'language', 'notifications', 'units', 'theme',
            'emailNotifications', 'smsNotifications', 'pushNotifications',
            'weatherAlerts', 'priceAlerts', 'cropReminders'
        ];
        
        const updates = {};
        allowedSettings.forEach(setting => {
            if (req.body[setting] !== undefined) {
                updates[`preferences.${setting}`] = req.body[setting];
            }
        });
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        );
        
        // Log the update
        await History.addEntry(req.user._id, 'settings-update', {
            updatedSettings: Object.keys(req.body)
        });
        
        logger.info(`Settings updated for user: ${user.phone}`);
        
        const settings = {
            ...defaultSettings,
            ...user.preferences
        };
        
        return successResponse(res, { settings }, 'Settings updated successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Update notification preferences
 * PUT /api/settings/notifications
 */
exports.updateNotifications = async (req, res, next) => {
    try {
        const { 
            notifications, 
            emailNotifications, 
            smsNotifications, 
            pushNotifications,
            weatherAlerts,
            priceAlerts,
            cropReminders
        } = req.body;
        
        const updates = {};
        
        if (notifications !== undefined) updates['preferences.notifications'] = notifications;
        if (emailNotifications !== undefined) updates['preferences.emailNotifications'] = emailNotifications;
        if (smsNotifications !== undefined) updates['preferences.smsNotifications'] = smsNotifications;
        if (pushNotifications !== undefined) updates['preferences.pushNotifications'] = pushNotifications;
        if (weatherAlerts !== undefined) updates['preferences.weatherAlerts'] = weatherAlerts;
        if (priceAlerts !== undefined) updates['preferences.priceAlerts'] = priceAlerts;
        if (cropReminders !== undefined) updates['preferences.cropReminders'] = cropReminders;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        );
        
        logger.info(`Notification settings updated for user: ${user.phone}`);
        
        return successResponse(res, {
            notifications: {
                enabled: user.preferences.notifications,
                email: user.preferences.emailNotifications,
                sms: user.preferences.smsNotifications,
                push: user.preferences.pushNotifications,
                weatherAlerts: user.preferences.weatherAlerts,
                priceAlerts: user.preferences.priceAlerts,
                cropReminders: user.preferences.cropReminders
            }
        }, 'Notification settings updated');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Update language preference
 * PUT /api/settings/language
 */
exports.updateLanguage = async (req, res, next) => {
    try {
        const { language } = req.body;
        
        const supportedLanguages = ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'pa'];
        if (!supportedLanguages.includes(language)) {
            language = 'en';
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { 'preferences.language': language } },
            { new: true }
        );
        
        logger.info(`Language changed to ${language} for user: ${user.phone}`);
        
        return successResponse(res, {
            language: user.preferences.language
        }, 'Language updated');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Update theme preference
 * PUT /api/settings/theme
 */
exports.updateTheme = async (req, res, next) => {
    try {
        const { theme } = req.body;
        
        const supportedThemes = ['light', 'dark', 'auto'];
        if (!supportedThemes.includes(theme)) {
            theme = 'light';
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { 'preferences.theme': theme } },
            { new: true }
        );
        
        logger.info(`Theme changed to ${theme} for user: ${user.phone}`);
        
        return successResponse(res, {
            theme: user.preferences.theme
        }, 'Theme updated');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Reset to default settings
 * POST /api/settings/reset
 */
exports.resetSettings = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { preferences: defaultSettings } },
            { new: true }
        );
        
        logger.info(`Settings reset for user: ${user.phone}`);
        
        return successResponse(res, {
            settings: defaultSettings
        }, 'Settings reset to defaults');
        
    } catch (error) {
        next(error);
    }
};
