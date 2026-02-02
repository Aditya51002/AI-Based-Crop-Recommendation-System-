/**
 * Market Price Routes
 * Agricultural market prices and trends
 */

const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// Get market prices
router.get('/', optionalAuth, marketController.getPrices);

// Get price trends for a crop
router.get('/trends/:crop', optionalAuth, marketController.getTrends);

// Get nearby markets
router.get('/nearby', optionalAuth, marketController.getNearbyMarkets);

// Get market details
router.get('/market/:id', marketController.getMarketDetails);

module.exports = router;
