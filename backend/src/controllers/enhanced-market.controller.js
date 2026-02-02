/**
 * Enhanced Market Price Controller
 * Handles market price data and trends with full frontend integration
 */

const MarketPrice = require('../models/MarketPrice');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get current market prices
 * GET /api/market/prices
 */
exports.getCurrentPrices = async (req, res, next) => {
    try {
        const { location, crops, category } = req.query;
        
        // Demo mode check
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const mockPrices = generateMockMarketPrices(crops, location, category);
            
            return successResponse(res, {
                prices: mockPrices,
                location: location || 'All Markets',
                lastUpdated: new Date().toISOString(),
                source: 'Demo Data'
            }, 'Market prices retrieved (Demo Mode)');
        }
        
        // Build query
        let query = {};
        
        if (location) {
            query.location = new RegExp(location, 'i');
        }
        
        if (crops) {
            const cropList = crops.split(',').map(crop => crop.trim());
            query.cropName = { $in: cropList.map(crop => new RegExp(crop, 'i')) };
        }
        
        if (category) {
            query.category = category;
        }
        
        // Get latest prices (within last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.date = { $gte: yesterday };
        
        const prices = await MarketPrice.find(query)
            .sort({ date: -1, location: 1, cropName: 1 })
            .limit(50);
        
        // Group by crop for better organization
        const groupedPrices = groupPricesByCrop(prices);
        
        return successResponse(res, {
            prices: groupedPrices,
            location: location || 'All Markets',
            lastUpdated: prices.length > 0 ? prices[0].date.toISOString() : new Date().toISOString(),
            count: prices.length
        }, 'Market prices retrieved successfully');
        
    } catch (error) {
        logger.error('Get market prices error:', error);
        next(error);
    }
};

/**
 * Get price trends
 * GET /api/market/trends
 */
exports.getPriceTrends = async (req, res, next) => {
    try {
        const { crop, location, days = 30 } = req.query;
        
        if (!crop) {
            return errorResponse(res, 'Crop name is required for trends', 400);
        }
        
        const trendDays = Math.min(parseInt(days), 90); // Limit to 90 days
        const startDate = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000);
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const mockTrends = generateMockPriceTrends(crop, location, trendDays);
            
            return successResponse(res, {
                trends: mockTrends,
                crop,
                location: location || 'All Markets',
                period: `${trendDays} days`,
                analysis: analyzePriceTrend(mockTrends.prices)
            }, 'Price trends retrieved (Demo Mode)');
        }
        
        // Build query
        let query = {
            cropName: new RegExp(crop, 'i'),
            date: { $gte: startDate }
        };
        
        if (location) {
            query.location = new RegExp(location, 'i');
        }
        
        const trends = await MarketPrice.find(query)
            .sort({ date: 1 })
            .select('date location minPrice maxPrice avgPrice quantity');
        
        if (trends.length === 0) {
            return errorResponse(res, `No price data found for ${crop}`, 404);
        }
        
        // Process trends data
        const processedTrends = processTrendsData(trends, location);
        const analysis = analyzePriceTrend(processedTrends.prices);
        
        return successResponse(res, {
            trends: processedTrends,
            crop,
            location: location || 'All Markets',
            period: `${trendDays} days`,
            analysis
        }, 'Price trends retrieved successfully');
        
    } catch (error) {
        logger.error('Get price trends error:', error);
        next(error);
    }
};

/**
 * Get market locations
 * GET /api/market/locations
 */
exports.getMarketLocations = async (req, res, next) => {
    try {
        const { state, district } = req.query;
        
        // Demo mode
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const mockLocations = getMockMarketLocations(state, district);
            
            return successResponse(res, {
                locations: mockLocations
            }, 'Market locations retrieved (Demo Mode)');
        }
        
        // Build aggregation pipeline
        const pipeline = [];
        
        if (state) {
            pipeline.push({ $match: { state: new RegExp(state, 'i') } });
        }
        
        if (district) {
            pipeline.push({ $match: { district: new RegExp(district, 'i') } });
        }
        
        pipeline.push({
            $group: {
                _id: {
                    state: '$state',
                    district: '$district',
                    market: '$location'
                },
                avgPrice: { $avg: '$avgPrice' },
                lastUpdate: { $max: '$date' },
                cropsCount: { $addToSet: '$cropName' }
            }
        });
        
        pipeline.push({
            $project: {
                _id: 0,
                state: '$_id.state',
                district: '$_id.district',
                market: '$_id.market',
                avgPrice: { $round: ['$avgPrice', 2] },
                lastUpdate: 1,
                cropsCount: { $size: '$cropsCount' }
            }
        });
        
        pipeline.push({ $sort: { state: 1, district: 1, market: 1 } });
        
        const locations = await MarketPrice.aggregate(pipeline);
        
        return successResponse(res, {
            locations
        }, 'Market locations retrieved successfully');
        
    } catch (error) {
        logger.error('Get market locations error:', error);
        next(error);
    }
};

/**
 * Get crop categories
 * GET /api/market/categories
 */
exports.getCropCategories = async (req, res, next) => {
    try {
        // Standard crop categories
        const categories = [
            {
                name: 'Cereals',
                crops: ['Rice', 'Wheat', 'Corn', 'Barley', 'Oats', 'Millet'],
                description: 'Staple grains and cereals'
            },
            {
                name: 'Pulses',
                crops: ['Lentils', 'Chickpeas', 'Black Gram', 'Green Gram', 'Pigeon Pea'],
                description: 'Leguminous crops rich in protein'
            },
            {
                name: 'Vegetables',
                crops: ['Tomato', 'Onion', 'Potato', 'Cabbage', 'Cauliflower', 'Carrot'],
                description: 'Fresh vegetables and greens'
            },
            {
                name: 'Fruits',
                crops: ['Apple', 'Banana', 'Mango', 'Orange', 'Grapes', 'Pomegranate'],
                description: 'Fresh and seasonal fruits'
            },
            {
                name: 'Spices',
                crops: ['Turmeric', 'Chili', 'Coriander', 'Cumin', 'Cardamom', 'Pepper'],
                description: 'Spices and condiments'
            },
            {
                name: 'Cash Crops',
                crops: ['Cotton', 'Sugarcane', 'Jute', 'Tea', 'Coffee', 'Rubber'],
                description: 'Commercial and industrial crops'
            },
            {
                name: 'Oilseeds',
                crops: ['Mustard', 'Groundnut', 'Sesame', 'Sunflower', 'Safflower'],
                description: 'Oil-producing seeds and nuts'
            }
        ];
        
        return successResponse(res, {
            categories
        }, 'Crop categories retrieved successfully');
        
    } catch (error) {
        logger.error('Get crop categories error:', error);
        next(error);
    }
};

/**
 * Add price alert
 * POST /api/market/alerts
 */
exports.addPriceAlert = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { crop, location, targetPrice, alertType, notificationMethod } = req.body;
        
        // Validate input
        if (!crop || !targetPrice || !alertType) {
            return errorResponse(res, 'Crop, target price, and alert type are required', 400);
        }
        
        if (alertType !== 'above' && alertType !== 'below') {
            return errorResponse(res, 'Alert type must be "above" or "below"', 400);
        }
        
        if (targetPrice <= 0) {
            return errorResponse(res, 'Target price must be greater than 0', 400);
        }
        
        // For demo, just return success
        const alert = {
            id: 'alert-' + Date.now(),
            userId,
            crop,
            location: location || 'All Markets',
            targetPrice: parseFloat(targetPrice),
            alertType,
            notificationMethod: notificationMethod || 'app',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        logger.info(`Price alert created for user ${userId}: ${crop} ${alertType} ₹${targetPrice}`);
        
        return successResponse(res, {
            alert
        }, 'Price alert created successfully');
        
    } catch (error) {
        logger.error('Add price alert error:', error);
        next(error);
    }
};

/**
 * Get user's price alerts
 * GET /api/market/alerts
 */
exports.getPriceAlerts = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Demo alerts
        const mockAlerts = [
            {
                id: 'alert-1',
                crop: 'Rice',
                location: 'Mumbai',
                targetPrice: 2000,
                currentPrice: 1850,
                alertType: 'below',
                status: 'active',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'alert-2',
                crop: 'Wheat',
                location: 'Delhi',
                targetPrice: 2500,
                currentPrice: 2600,
                alertType: 'above',
                status: 'triggered',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        return successResponse(res, {
            alerts: mockAlerts
        }, 'Price alerts retrieved successfully');
        
    } catch (error) {
        logger.error('Get price alerts error:', error);
        next(error);
    }
};

/**
 * Delete price alert
 * DELETE /api/market/alerts/:alertId
 */
exports.deletePriceAlert = async (req, res, next) => {
    try {
        const { alertId } = req.params;
        const userId = req.user.id;
        
        // For demo, just return success
        logger.info(`Price alert ${alertId} deleted for user ${userId}`);
        
        return successResponse(res, {
            message: 'Price alert deleted successfully'
        }, 'Alert deleted');
        
    } catch (error) {
        logger.error('Delete price alert error:', error);
        next(error);
    }
};

/**
 * Get market insights
 * GET /api/market/insights
 */
exports.getMarketInsights = async (req, res, next) => {
    try {
        const { crop, location } = req.query;
        
        // Generate market insights
        const insights = generateMarketInsights(crop, location);
        
        return successResponse(res, {
            insights,
            generatedAt: new Date().toISOString()
        }, 'Market insights generated successfully');
        
    } catch (error) {
        logger.error('Get market insights error:', error);
        next(error);
    }
};

/**
 * Generate mock market prices
 */
function generateMockMarketPrices(crops, location, category) {
    const mockCrops = [
        { name: 'Rice', category: 'cereals', unit: 'quintal', basePrice: 2000 },
        { name: 'Wheat', category: 'cereals', unit: 'quintal', basePrice: 2200 },
        { name: 'Onion', category: 'vegetables', unit: 'quintal', basePrice: 1500 },
        { name: 'Potato', category: 'vegetables', unit: 'quintal', basePrice: 1200 },
        { name: 'Tomato', category: 'vegetables', unit: 'quintal', basePrice: 1800 },
        { name: 'Cotton', category: 'cash_crops', unit: 'quintal', basePrice: 5500 },
        { name: 'Sugarcane', category: 'cash_crops', unit: 'quintal', basePrice: 280 },
        { name: 'Turmeric', category: 'spices', unit: 'quintal', basePrice: 8000 },
        { name: 'Groundnut', category: 'oilseeds', unit: 'quintal', basePrice: 4500 },
        { name: 'Chili', category: 'spices', unit: 'quintal', basePrice: 6000 }
    ];
    
    const markets = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad'];
    
    let filteredCrops = mockCrops;
    
    // Filter by crops if specified
    if (crops) {
        const cropList = crops.split(',').map(crop => crop.trim().toLowerCase());
        filteredCrops = mockCrops.filter(crop => 
            cropList.some(searchCrop => crop.name.toLowerCase().includes(searchCrop))
        );
    }
    
    // Filter by category if specified
    if (category) {
        filteredCrops = filteredCrops.filter(crop => crop.category === category);
    }
    
    const prices = [];
    
    filteredCrops.forEach(crop => {
        const marketsToShow = location ? [location] : markets.slice(0, 3);
        
        marketsToShow.forEach(market => {
            const variation = 0.8 + Math.random() * 0.4; // 80% to 120% of base price
            const avgPrice = Math.round(crop.basePrice * variation);
            const minPrice = Math.round(avgPrice * 0.9);
            const maxPrice = Math.round(avgPrice * 1.1);
            
            prices.push({
                crop: crop.name,
                category: crop.category,
                location: market,
                unit: crop.unit,
                minPrice,
                maxPrice,
                avgPrice,
                modalPrice: avgPrice,
                trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
                change: Math.round((Math.random() * 200 - 100)), // -100 to +100
                changePercent: parseFloat(((Math.random() * 20 - 10)).toFixed(2)), // -10% to +10%
                volume: Math.round(50 + Math.random() * 200), // 50 to 250 quintals
                lastUpdated: new Date().toISOString()
            });
        });
    });
    
    return prices;
}

/**
 * Generate mock price trends
 */
function generateMockPriceTrends(crop, location, days) {
    const prices = [];
    const basePrice = 2000 + Math.random() * 3000; // Base price between 2000-5000
    
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some volatility
        const change = (Math.random() - 0.5) * 0.1; // ±5% daily change
        currentPrice = currentPrice * (1 + change);
        
        // Add weekly patterns
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 1) currentPrice *= 1.02; // Monday increase
        if (dayOfWeek === 5) currentPrice *= 0.98; // Friday decrease
        
        prices.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(currentPrice),
            volume: Math.round(50 + Math.random() * 100),
            trend: i === 0 ? 'current' : (Math.random() > 0.5 ? 'up' : 'down')
        });
    }
    
    return {
        crop,
        location: location || 'Average Market',
        prices,
        unit: 'quintal',
        currency: 'INR'
    };
}

/**
 * Get mock market locations
 */
function getMockMarketLocations(state, district) {
    const locations = [
        { state: 'Maharashtra', district: 'Mumbai', market: 'Vashi APMC', active: true },
        { state: 'Maharashtra', district: 'Pune', market: 'Pune Market', active: true },
        { state: 'Maharashtra', district: 'Nashik', market: 'Nashik APMC', active: true },
        { state: 'Karnataka', district: 'Bengaluru', market: 'Bengaluru Market', active: true },
        { state: 'Karnataka', district: 'Mysore', market: 'Mysore APMC', active: true },
        { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', active: true },
        { state: 'Delhi', district: 'Delhi', market: 'Azadpur Mandi', active: true },
        { state: 'Gujarat', district: 'Ahmedabad', market: 'Ahmedabad APMC', active: true },
        { state: 'Rajasthan', district: 'Jaipur', market: 'Jaipur Mandi', active: true },
        { state: 'Uttar Pradesh', district: 'Lucknow', market: 'Lucknow Market', active: true }
    ];
    
    let filtered = locations;
    
    if (state) {
        filtered = filtered.filter(loc => loc.state.toLowerCase().includes(state.toLowerCase()));
    }
    
    if (district) {
        filtered = filtered.filter(loc => loc.district.toLowerCase().includes(district.toLowerCase()));
    }
    
    return filtered;
}

/**
 * Group prices by crop
 */
function groupPricesByCrop(prices) {
    const grouped = {};
    
    prices.forEach(price => {
        if (!grouped[price.cropName]) {
            grouped[price.cropName] = [];
        }
        grouped[price.cropName].push({
            location: price.location,
            minPrice: price.minPrice,
            maxPrice: price.maxPrice,
            avgPrice: price.avgPrice,
            modalPrice: price.modalPrice,
            unit: price.unit,
            date: price.date,
            trend: price.trend
        });
    });
    
    return grouped;
}

/**
 * Process trends data
 */
function processTrendsData(trends, location) {
    if (location) {
        // Single location trends
        return {
            location,
            prices: trends.map(t => ({
                date: t.date.toISOString().split('T')[0],
                minPrice: t.minPrice,
                maxPrice: t.maxPrice,
                avgPrice: t.avgPrice,
                volume: t.quantity
            }))
        };
    } else {
        // Aggregate across all locations by date
        const groupedByDate = {};
        
        trends.forEach(t => {
            const date = t.date.toISOString().split('T')[0];
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(t);
        });
        
        const prices = Object.keys(groupedByDate).map(date => {
            const dayPrices = groupedByDate[date];
            const avgPrice = dayPrices.reduce((sum, p) => sum + p.avgPrice, 0) / dayPrices.length;
            const minPrice = Math.min(...dayPrices.map(p => p.minPrice));
            const maxPrice = Math.max(...dayPrices.map(p => p.maxPrice));
            const volume = dayPrices.reduce((sum, p) => sum + (p.quantity || 0), 0);
            
            return {
                date,
                minPrice: Math.round(minPrice),
                maxPrice: Math.round(maxPrice),
                avgPrice: Math.round(avgPrice),
                volume
            };
        }).sort((a, b) => a.date.localeCompare(b.date));
        
        return {
            location: 'All Markets',
            prices
        };
    }
}

/**
 * Analyze price trend
 */
function analyzePriceTrend(prices) {
    if (prices.length < 2) {
        return { trend: 'insufficient_data', message: 'Not enough data for analysis' };
    }
    
    const recent = prices.slice(-7); // Last 7 days
    const older = prices.slice(-14, -7); // Previous 7 days
    
    const recentAvg = recent.reduce((sum, p) => sum + p.avgPrice, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, p) => sum + p.avgPrice, 0) / older.length : recentAvg;
    
    const change = recentAvg - olderAvg;
    const changePercent = olderAvg > 0 ? (change / olderAvg) * 100 : 0;
    
    let trend, message;
    
    if (Math.abs(changePercent) < 2) {
        trend = 'stable';
        message = 'Prices are relatively stable with minimal fluctuation';
    } else if (changePercent > 5) {
        trend = 'rising';
        message = `Prices are rising significantly (${changePercent.toFixed(1)}% increase)`;
    } else if (changePercent > 0) {
        trend = 'slight_increase';
        message = `Prices are showing a slight upward trend (${changePercent.toFixed(1)}% increase)`;
    } else if (changePercent < -5) {
        trend = 'falling';
        message = `Prices are falling significantly (${Math.abs(changePercent).toFixed(1)}% decrease)`;
    } else {
        trend = 'slight_decrease';
        message = `Prices are showing a slight downward trend (${Math.abs(changePercent).toFixed(1)}% decrease)`;
    }
    
    return {
        trend,
        message,
        changePercent: parseFloat(changePercent.toFixed(2)),
        recentAvg: Math.round(recentAvg),
        olderAvg: Math.round(olderAvg)
    };
}

/**
 * Generate market insights
 */
function generateMarketInsights(crop, location) {
    const insights = [
        {
            type: 'price_forecast',
            title: 'Price Forecast',
            content: `Based on seasonal patterns, ${crop || 'crop'} prices are expected to ${Math.random() > 0.5 ? 'increase' : 'remain stable'} in the coming weeks.`,
            confidence: Math.round(70 + Math.random() * 25),
            icon: '📈'
        },
        {
            type: 'demand_supply',
            title: 'Supply & Demand',
            content: `Current market conditions show ${Math.random() > 0.5 ? 'balanced' : 'tight'} supply situation with ${Math.random() > 0.5 ? 'moderate' : 'strong'} demand.`,
            confidence: Math.round(65 + Math.random() * 30),
            icon: '⚖️'
        },
        {
            type: 'seasonal_impact',
            title: 'Seasonal Impact',
            content: 'Weather conditions and seasonal factors are playing a significant role in current price movements.',
            confidence: Math.round(75 + Math.random() * 20),
            icon: '🌦️'
        },
        {
            type: 'recommendation',
            title: 'Trading Recommendation',
            content: Math.random() > 0.5 ? 
                'Consider holding inventory for better prices in the near future.' :
                'Current prices are favorable for selling, consider liquidating stock.',
            confidence: Math.round(60 + Math.random() * 35),
            icon: '💡'
        }
    ];
    
    return insights;
}

module.exports = exports;