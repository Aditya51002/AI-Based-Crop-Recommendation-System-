/**
 * Settings Routes
 * User preferences and app settings
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth.middleware');

// All settings routes require authentication
router.use(protect);

// Get user settings
router.get('/', settingsController.getSettings);

// Update user settings
router.put('/', settingsController.updateSettings);

// Update notification preferences
router.put('/notifications', settingsController.updateNotifications);

// Update language preference
router.put('/language', settingsController.updateLanguage);

// Update theme preference
router.put('/theme', settingsController.updateTheme);

// Reset to default settings
router.post('/reset', settingsController.resetSettings);

module.exports = router;
