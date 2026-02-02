/**
 * Crop Recommendation Routes
 * AI-based crop recommendation endpoints
 */

const express = require('express');
const router = express.Router();
const cropController = require('../controllers/crop.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { validationRules } = require('../utils/validators');

// Get crop recommendation (works with or without auth)
router.post('/', optionalAuth, validationRules.cropRecommendation, cropController.getRecommendation);

// Get recommendation history (requires auth)
router.get('/history', protect, cropController.getHistory);

// Get crop details
router.get('/details/:crop', cropController.getCropDetails);

// Get all available crops
router.get('/list', cropController.getAllCrops);

module.exports = router;
