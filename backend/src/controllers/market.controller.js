/**
 * Market Price Controller
 * Agricultural market prices and trends
 */

const { AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Simulated market data
const marketData = {
    rice: {
        name: 'Rice (Basmati)',
        unit: 'quintal',
        currentPrice: 3500,
        minPrice: 3200,
        maxPrice: 4000,
        change: 2.5,
        trend: 'up'
    },
    wheat: {
        name: 'Wheat',
        unit: 'quintal',
        currentPrice: 2200,
        minPrice: 2000,
        maxPrice: 2500,
        change: -1.2,
        trend: 'down'
    },
    maize: {
        name: 'Maize',
        unit: 'quintal',
        currentPrice: 1950,
        minPrice: 1800,
        maxPrice: 2100,
        change: 0.8,
        trend: 'up'
    },
    cotton: {
        name: 'Cotton',
        unit: 'quintal',
        currentPrice: 6800,
        minPrice: 6500,
        maxPrice: 7200,
        change: 3.1,
        trend: 'up'
    },
    soybean: {
        name: 'Soybean',
        unit: 'quintal',
        currentPrice: 4500,
        minPrice: 4200,
        maxPrice: 4800,
        change: -0.5,
        trend: 'down'
    },
    potato: {
        name: 'Potato',
        unit: 'quintal',
        currentPrice: 1200,
        minPrice: 800,
        maxPrice: 1800,
        change: 5.2,
        trend: 'up'
    },
    tomato: {
        name: 'Tomato',
        unit: 'quintal',
        currentPrice: 2500,
        minPrice: 1500,
        maxPrice: 4000,
        change: -8.5,
        trend: 'down'
    },
    onion: {
        name: 'Onion',
        unit: 'quintal',
        currentPrice: 1800,
        minPrice: 1200,
        maxPrice: 2500,
        change: 4.3,
        trend: 'up'
    },
    sugarcane: {
        name: 'Sugarcane',
        unit: 'quintal',
        currentPrice: 350,
        minPrice: 300,
        maxPrice: 400,
        change: 0.3,
        trend: 'stable'
    },
    groundnut: {
        name: 'Groundnut',
        unit: 'quintal',
        currentPrice: 5800,
        minPrice: 5500,
        maxPrice: 6200,
        change: 1.8,
        trend: 'up'
    }
};

// Simulated markets
const markets = [
    {
        id: 'mkt-1',
        name: 'Azadpur Mandi',
        location: 'New Delhi',
        type: 'Wholesale',
        distance: 5.2,
        crops: ['tomato', 'potato', 'onion'],
        timings: '4:00 AM - 12:00 PM',
        contact: '+91-11-27694610'
    },
    {
        id: 'mkt-2',
        name: 'Karnal Grain Market',
        location: 'Karnal, Haryana',
        type: 'Grain Market',
        distance: 125,
        crops: ['rice', 'wheat', 'maize'],
        timings: '6:00 AM - 6:00 PM',
        contact: '+91-184-2260123'
    },
    {
        id: 'mkt-3',
        name: 'Sirsa Cotton Market',
        location: 'Sirsa, Haryana',
        type: 'Cotton Market',
        distance: 260,
        crops: ['cotton'],
        timings: '8:00 AM - 5:00 PM',
        contact: '+91-1666-223456'
    },
    {
        id: 'mkt-4',
        name: 'Indore Soya Market',
        location: 'Indore, Madhya Pradesh',
        type: 'Oilseeds Market',
        distance: 800,
        crops: ['soybean', 'groundnut'],
        timings: '9:00 AM - 6:00 PM',
        contact: '+91-731-2432100'
    }
];

const generatePriceHistory = (crop, days = 30) => {
    const history = [];
    const basePrice = marketData[crop]?.currentPrice || 2000;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some randomness to price
        const variance = basePrice * 0.1; // 10% variance
        const price = basePrice + (Math.random() - 0.5) * variance;
        
        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price),
            volume: Math.round(1000 + Math.random() * 5000)
        });
    }
    
    return history;
};

/**
 * Get market prices
 * GET /api/market-prices
 */
exports.getPrices = async (req, res, next) => {
    try {
        const { crop, location } = req.query;
        
        let prices;
        
        if (crop) {
            const cropKey = crop.toLowerCase();
            if (!marketData[cropKey]) {
                return next(new AppError('Crop not found', 404, 'CROP_NOT_FOUND'));
            }
            prices = [{
                id: cropKey,
                ...marketData[cropKey],
                lastUpdated: new Date().toISOString()
            }];
        } else {
            prices = Object.entries(marketData).map(([id, data]) => ({
                id,
                ...data,
                lastUpdated: new Date().toISOString()
            }));
        }
        
        logger.info(`Market prices fetched${crop ? ` for ${crop}` : ''}`);
        
        return successResponse(res, {
            prices,
            location: location || 'All India',
            summary: {
                gainers: Object.entries(marketData)
                    .filter(([, d]) => d.change > 0)
                    .sort(([, a], [, b]) => b.change - a.change)
                    .slice(0, 3)
                    .map(([id, d]) => ({ id, name: d.name, change: d.change })),
                losers: Object.entries(marketData)
                    .filter(([, d]) => d.change < 0)
                    .sort(([, a], [, b]) => a.change - b.change)
                    .slice(0, 3)
                    .map(([id, d]) => ({ id, name: d.name, change: d.change }))
            }
        }, 'Market prices retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get price trends
 * GET /api/market-prices/trends/:crop
 */
exports.getTrends = async (req, res, next) => {
    try {
        const { crop } = req.params;
        const { days = 30 } = req.query;
        
        const cropKey = crop.toLowerCase();
        if (!marketData[cropKey]) {
            return next(new AppError('Crop not found', 404, 'CROP_NOT_FOUND'));
        }
        
        const history = generatePriceHistory(cropKey, parseInt(days));
        const cropData = marketData[cropKey];
        
        // Calculate statistics
        const prices = history.map(h => h.price);
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        
        return successResponse(res, {
            crop: {
                id: cropKey,
                ...cropData
            },
            history,
            statistics: {
                averagePrice: avgPrice,
                highestPrice: maxPrice,
                lowestPrice: minPrice,
                volatility: Math.round(((maxPrice - minPrice) / avgPrice) * 100),
                trend: cropData.trend
            },
            forecast: {
                nextWeek: Math.round(cropData.currentPrice * (1 + (Math.random() - 0.5) * 0.1)),
                nextMonth: Math.round(cropData.currentPrice * (1 + (Math.random() - 0.5) * 0.2)),
                confidence: Math.round(60 + Math.random() * 25)
            }
        }, 'Price trends retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get nearby markets
 * GET /api/market-prices/nearby
 */
exports.getNearbyMarkets = async (req, res, next) => {
    try {
        const { lat, lon, radius = 100, crop } = req.query;
        
        let filteredMarkets = [...markets];
        
        // Filter by crop if provided
        if (crop) {
            filteredMarkets = filteredMarkets.filter(m => 
                m.crops.includes(crop.toLowerCase())
            );
        }
        
        // Filter by radius
        if (radius) {
            filteredMarkets = filteredMarkets.filter(m => m.distance <= parseInt(radius));
        }
        
        // Sort by distance
        filteredMarkets.sort((a, b) => a.distance - b.distance);
        
        return successResponse(res, {
            markets: filteredMarkets,
            total: filteredMarkets.length,
            radius: parseInt(radius)
        }, 'Nearby markets retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get market details
 * GET /api/market-prices/market/:id
 */
exports.getMarketDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const market = markets.find(m => m.id === id);
        if (!market) {
            return next(new AppError('Market not found', 404, 'MARKET_NOT_FOUND'));
        }
        
        // Get prices for crops traded in this market
        const cropPrices = market.crops.map(cropId => ({
            id: cropId,
            ...marketData[cropId],
            lastUpdated: new Date().toISOString()
        }));
        
        return successResponse(res, {
            market: {
                ...market,
                facilities: ['Weighing Bridge', 'Cold Storage', 'Loading/Unloading', 'Parking'],
                averageFootfall: Math.round(500 + Math.random() * 2000) + ' vehicles/day'
            },
            prices: cropPrices
        }, 'Market details retrieved');
        
    } catch (error) {
        next(error);
    }
};
