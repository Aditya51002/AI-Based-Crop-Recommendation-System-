/**
 * Enhanced Crop Controller
 * Handles crop recommendation API with full frontend integration
 */

const Recommendation = require('../models/Recommendation');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get crop recommendation
 * POST /api/crops/recommend
 */
exports.getCropRecommendation = async (req, res, next) => {
    try {
        const { soil_data, location, season, previous_crop } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!soil_data || !location || !season) {
            return errorResponse(res, 'Soil data, location, and season are required', 400);
        }

        // Validate soil data structure
        const { ph, nitrogen, phosphorus, potassium, moisture } = soil_data;
        if (ph === undefined || nitrogen === undefined || phosphorus === undefined || 
            potassium === undefined || moisture === undefined) {
            return errorResponse(res, 'Complete soil data (pH, N, P, K, moisture) is required', 400);
        }

        // Validate location
        const { latitude, longitude } = location;
        if (latitude === undefined || longitude === undefined) {
            return errorResponse(res, 'Location coordinates (latitude, longitude) are required', 400);
        }

        // Demo/Mock recommendation logic for immediate frontend testing
        const mockRecommendations = generateMockRecommendations(soil_data, season, previous_crop);

        // Create recommendation record
        const recommendation = new Recommendation({
            userId,
            soilData: {
                ph: parseFloat(ph),
                nitrogen: parseFloat(nitrogen),
                phosphorus: parseFloat(phosphorus),
                potassium: parseFloat(potassium),
                moisture: parseFloat(moisture)
            },
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            season,
            previousCrop: previous_crop,
            recommendations: mockRecommendations
        });

        await recommendation.save();

        logger.info(`Crop recommendation generated for user: ${userId}`);

        return successResponse(res, {
            recommendations: mockRecommendations,
            recommendationId: recommendation._id
        }, 'Crop recommendations generated successfully');

    } catch (error) {
        logger.error('Crop recommendation error:', error);
        next(error);
    }
};

/**
 * Get recommendation history
 * GET /api/crops/history
 */
exports.getRecommendationHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        const recommendations = await Recommendation.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-__v');

        return successResponse(res, {
            history: recommendations
        }, 'Recommendation history retrieved successfully');

    } catch (error) {
        logger.error('Get recommendation history error:', error);
        next(error);
    }
};

/**
 * Save recommendation result
 * POST /api/crops/save-recommendation
 */
exports.saveRecommendation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { recommendationId, selectedCrops, notes } = req.body;

        const recommendation = await Recommendation.findOne({
            _id: recommendationId,
            userId
        });

        if (!recommendation) {
            return errorResponse(res, 'Recommendation not found', 404);
        }

        // Update recommendation with user selections
        recommendation.selectedCrops = selectedCrops;
        recommendation.notes = notes;
        recommendation.savedAt = new Date();
        
        await recommendation.save();

        logger.info(`Recommendation saved for user: ${userId}`);

        return successResponse(res, {
            message: 'Recommendation saved successfully'
        });

    } catch (error) {
        logger.error('Save recommendation error:', error);
        next(error);
    }
};

/**
 * Get crop list
 * GET /api/crops/list
 */
exports.getCropList = async (req, res, next) => {
    try {
        // Mock crop list for immediate frontend testing
        const crops = [
            { id: 'rice', name: 'Rice', category: 'cereal', season: ['kharif'] },
            { id: 'wheat', name: 'Wheat', category: 'cereal', season: ['rabi'] },
            { id: 'corn', name: 'Corn', category: 'cereal', season: ['kharif'] },
            { id: 'cotton', name: 'Cotton', category: 'cash_crop', season: ['kharif'] },
            { id: 'sugarcane', name: 'Sugarcane', category: 'cash_crop', season: ['year-round'] },
            { id: 'potato', name: 'Potato', category: 'vegetable', season: ['rabi'] },
            { id: 'tomato', name: 'Tomato', category: 'vegetable', season: ['summer'] },
            { id: 'onion', name: 'Onion', category: 'vegetable', season: ['rabi'] },
            { id: 'soybean', name: 'Soybean', category: 'legume', season: ['kharif'] },
            { id: 'groundnut', name: 'Groundnut', category: 'oilseed', season: ['kharif'] }
        ];

        return successResponse(res, { crops }, 'Crop list retrieved successfully');

    } catch (error) {
        logger.error('Get crop list error:', error);
        next(error);
    }
};

/**
 * Generate mock recommendations for testing
 */
function generateMockRecommendations(soilData, season, previousCrop) {
    const { ph, nitrogen, phosphorus, potassium, moisture } = soilData;
    
    // Define crop recommendations based on soil conditions and season
    const cropDatabase = {
        kharif: [
            {
                cropName: 'Rice',
                baseScore: 0.85,
                phRange: [5.5, 7.0],
                nRequirement: 40,
                pRequirement: 20,
                kRequirement: 20,
                moistureRequirement: 70
            },
            {
                cropName: 'Cotton',
                baseScore: 0.80,
                phRange: [6.0, 8.0],
                nRequirement: 50,
                pRequirement: 25,
                kRequirement: 30,
                moistureRequirement: 60
            },
            {
                cropName: 'Soybean',
                baseScore: 0.75,
                phRange: [6.0, 7.5],
                nRequirement: 30,
                pRequirement: 30,
                kRequirement: 25,
                moistureRequirement: 65
            },
            {
                cropName: 'Corn',
                baseScore: 0.70,
                phRange: [6.0, 7.5],
                nRequirement: 60,
                pRequirement: 30,
                kRequirement: 40,
                moistureRequirement: 65
            }
        ],
        rabi: [
            {
                cropName: 'Wheat',
                baseScore: 0.90,
                phRange: [6.0, 7.5],
                nRequirement: 45,
                pRequirement: 25,
                kRequirement: 20,
                moistureRequirement: 50
            },
            {
                cropName: 'Potato',
                baseScore: 0.85,
                phRange: [5.5, 6.5],
                nRequirement: 50,
                pRequirement: 40,
                kRequirement: 60,
                moistureRequirement: 70
            },
            {
                cropName: 'Onion',
                baseScore: 0.75,
                phRange: [6.0, 7.0],
                nRequirement: 40,
                pRequirement: 30,
                kRequirement: 35,
                moistureRequirement: 60
            },
            {
                cropName: 'Mustard',
                baseScore: 0.70,
                phRange: [6.5, 7.5],
                nRequirement: 35,
                pRequirement: 20,
                kRequirement: 25,
                moistureRequirement: 45
            }
        ],
        summer: [
            {
                cropName: 'Tomato',
                baseScore: 0.80,
                phRange: [6.0, 7.0],
                nRequirement: 55,
                pRequirement: 35,
                kRequirement: 45,
                moistureRequirement: 75
            },
            {
                cropName: 'Cucumber',
                baseScore: 0.75,
                phRange: [6.0, 7.0],
                nRequirement: 45,
                pRequirement: 25,
                kRequirement: 40,
                moistureRequirement: 80
            },
            {
                cropName: 'Watermelon',
                baseScore: 0.70,
                phRange: [6.0, 7.5],
                nRequirement: 40,
                pRequirement: 20,
                kRequirement: 35,
                moistureRequirement: 75
            }
        ]
    };

    const seasonCrops = cropDatabase[season] || cropDatabase.kharif;
    const recommendations = [];

    seasonCrops.forEach(crop => {
        let suitabilityScore = crop.baseScore;

        // Adjust score based on pH
        if (ph >= crop.phRange[0] && ph <= crop.phRange[1]) {
            suitabilityScore += 0.1;
        } else {
            suitabilityScore -= Math.abs(ph - (crop.phRange[0] + crop.phRange[1]) / 2) * 0.05;
        }

        // Adjust score based on nutrients
        const nScore = Math.max(0, 1 - Math.abs(nitrogen - crop.nRequirement) / crop.nRequirement);
        const pScore = Math.max(0, 1 - Math.abs(phosphorus - crop.pRequirement) / crop.pRequirement);
        const kScore = Math.max(0, 1 - Math.abs(potassium - crop.kRequirement) / crop.kRequirement);
        const mScore = Math.max(0, 1 - Math.abs(moisture - crop.moistureRequirement) / crop.moistureRequirement);

        suitabilityScore = (suitabilityScore + nScore + pScore + kScore + mScore) / 5;

        // Penalty for same previous crop
        if (previousCrop && previousCrop.toLowerCase() === crop.cropName.toLowerCase()) {
            suitabilityScore -= 0.15;
        }

        // Ensure score is between 0 and 1
        suitabilityScore = Math.max(0.1, Math.min(1.0, suitabilityScore));

        recommendations.push({
            crop_name: crop.cropName,
            suitability_score: parseFloat(suitabilityScore.toFixed(2)),
            predicted_yield: parseFloat((suitabilityScore * 50 + Math.random() * 10).toFixed(1)),
            profit_margin: Math.round(suitabilityScore * 45000 + Math.random() * 15000),
            sustainability_score: Math.round(suitabilityScore * 85 + 10),
            market_price: Math.round(2000 + Math.random() * 1500),
            growing_tips: generateGrowingTips(crop.cropName)
        });
    });

    // Sort by suitability score (descending)
    recommendations.sort((a, b) => b.suitability_score - a.suitability_score);

    return recommendations;
}

/**
 * Generate growing tips for crops
 */
function generateGrowingTips(cropName) {
    const tips = {
        Rice: [
            'Maintain water level 2-5 cm throughout growing season',
            'Apply organic manure before transplanting',
            'Monitor for brown plant hopper and stem borer',
            'Harvest when 85% of grains are golden yellow'
        ],
        Wheat: [
            'Sow seeds at 2-3 cm depth',
            'Apply nitrogen in 2-3 splits',
            'Irrigate at crown root initiation and flowering',
            'Harvest when moisture content is 20-25%'
        ],
        Cotton: [
            'Maintain plant spacing of 45-60 cm',
            'Deep ploughing before sowing',
            'Monitor for bollworm and whitefly',
            'Pick cotton when bolls are fully opened'
        ],
        Potato: [
            'Plant seed potatoes 4-5 cm deep',
            'Hill soil around plants as they grow',
            'Apply balanced NPK fertilizer',
            'Harvest when leaves turn yellow'
        ],
        Tomato: [
            'Transplant seedlings after 4-5 weeks',
            'Provide support stakes for plants',
            'Regular pruning of suckers',
            'Harvest when fruits are firm and red'
        ]
    };

    return tips[cropName] || [
        'Follow recommended seed rate and spacing',
        'Apply fertilizers based on soil test',
        'Monitor for pests and diseases regularly',
        'Harvest at optimal maturity stage'
    ];
}

module.exports = exports;