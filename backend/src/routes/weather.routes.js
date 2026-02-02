/**
 * Weather Routes
 * Weather data and forecasts
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// Get current weather by location
router.get('/', optionalAuth, weatherController.getCurrentWeather);

// Get weather forecast
router.get('/forecast', optionalAuth, weatherController.getForecast);

// Get historical weather data
router.get('/history', optionalAuth, weatherController.getHistorical);

// Get weather alerts
router.get('/alerts', optionalAuth, weatherController.getAlerts);

module.exports = router;
