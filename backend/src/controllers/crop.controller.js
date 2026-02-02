/**
 * Crop Recommendation Controller
 * AI-based crop recommendation logic
 */

const History = require('../models/History');
const { AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Crop database with recommendations
const cropDatabase = {
    rice: {
        name: 'Rice',
        scientificName: 'Oryza sativa',
        season: 'Kharif (June-July)',
        duration: '120-150 days',
        waterRequirement: 'High (1200-1400mm)',
        soilType: 'Clay loam, Alluvial',
        temperature: '20-35°C',
        humidity: '60-80%',
        ph: '5.5-7.0',
        nitrogen: '80-120 kg/ha',
        phosphorus: '40-60 kg/ha',
        potassium: '40-60 kg/ha',
        yield: '3-6 tons/hectare',
        marketPrice: '₹1,940/quintal (MSP)',
        tips: [
            'Ensure proper water management during flowering stage',
            'Use disease-resistant varieties for better yield',
            'Apply fertilizers in split doses'
        ],
        diseases: ['Blast', 'Bacterial Leaf Blight', 'Brown Spot'],
        image: '/images/crops/rice.jpg'
    },
    wheat: {
        name: 'Wheat',
        scientificName: 'Triticum aestivum',
        season: 'Rabi (October-December)',
        duration: '120-150 days',
        waterRequirement: 'Medium (400-500mm)',
        soilType: 'Loamy, Clay loam',
        temperature: '15-25°C',
        humidity: '50-70%',
        ph: '6.0-7.5',
        nitrogen: '100-120 kg/ha',
        phosphorus: '50-60 kg/ha',
        potassium: '40-50 kg/ha',
        yield: '3-5 tons/hectare',
        marketPrice: '₹2,125/quintal (MSP)',
        tips: [
            'Timely sowing is crucial for good yield',
            'First irrigation at crown root initiation stage',
            'Apply nitrogen in 2-3 split doses'
        ],
        diseases: ['Rust', 'Powdery Mildew', 'Loose Smut'],
        image: '/images/crops/wheat.jpg'
    },
    maize: {
        name: 'Maize',
        scientificName: 'Zea mays',
        season: 'Kharif & Rabi',
        duration: '90-120 days',
        waterRequirement: 'Medium (500-800mm)',
        soilType: 'Well-drained loamy',
        temperature: '21-27°C',
        humidity: '60-70%',
        ph: '5.5-7.0',
        nitrogen: '100-150 kg/ha',
        phosphorus: '60-80 kg/ha',
        potassium: '40-60 kg/ha',
        yield: '4-8 tons/hectare',
        marketPrice: '₹1,962/quintal (MSP)',
        tips: [
            'Avoid waterlogging as it affects root growth',
            'Tasseling stage is critical for irrigation',
            'Use hybrid varieties for better yield'
        ],
        diseases: ['Maize Streak Virus', 'Northern Leaf Blight', 'Stalk Rot'],
        image: '/images/crops/maize.jpg'
    },
    cotton: {
        name: 'Cotton',
        scientificName: 'Gossypium',
        season: 'Kharif (April-June)',
        duration: '150-180 days',
        waterRequirement: 'Medium (700-1200mm)',
        soilType: 'Black cotton, Alluvial',
        temperature: '21-30°C',
        humidity: '50-70%',
        ph: '6.0-8.0',
        nitrogen: '80-120 kg/ha',
        phosphorus: '40-60 kg/ha',
        potassium: '40-60 kg/ha',
        yield: '1.5-2.5 tons/hectare',
        marketPrice: '₹6,620/quintal (MSP)',
        tips: [
            'Proper spacing is essential for air circulation',
            'Monitor for bollworm infestation regularly',
            'Avoid excessive nitrogen to prevent vegetative growth'
        ],
        diseases: ['Cotton Leaf Curl', 'Bacterial Blight', 'Fusarium Wilt'],
        image: '/images/crops/cotton.jpg'
    },
    sugarcane: {
        name: 'Sugarcane',
        scientificName: 'Saccharum officinarum',
        season: 'February-March (Spring)',
        duration: '12-18 months',
        waterRequirement: 'High (1500-2500mm)',
        soilType: 'Deep loamy, Alluvial',
        temperature: '20-35°C',
        humidity: '70-85%',
        ph: '6.0-8.0',
        nitrogen: '250-300 kg/ha',
        phosphorus: '60-80 kg/ha',
        potassium: '80-100 kg/ha',
        yield: '70-100 tons/hectare',
        marketPrice: '₹315/quintal (FRP)',
        tips: [
            'Maintain adequate moisture during tillering',
            'Earthing up is essential for support',
            'Trash mulching helps conserve moisture'
        ],
        diseases: ['Red Rot', 'Smut', 'Grassy Shoot Disease'],
        image: '/images/crops/sugarcane.jpg'
    },
    potato: {
        name: 'Potato',
        scientificName: 'Solanum tuberosum',
        season: 'Rabi (October-November)',
        duration: '80-120 days',
        waterRequirement: 'Medium (400-600mm)',
        soilType: 'Sandy loam, Well-drained',
        temperature: '15-25°C',
        humidity: '60-80%',
        ph: '5.5-6.5',
        nitrogen: '150-200 kg/ha',
        phosphorus: '80-100 kg/ha',
        potassium: '100-120 kg/ha',
        yield: '20-30 tons/hectare',
        marketPrice: '₹1,200-2,000/quintal',
        tips: [
            'Use certified disease-free seed tubers',
            'Maintain soil moisture during tuber formation',
            'Proper hilling prevents greening of tubers'
        ],
        diseases: ['Late Blight', 'Early Blight', 'Black Scurf'],
        image: '/images/crops/potato.jpg'
    },
    tomato: {
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        season: 'Year-round (Protected)',
        duration: '90-120 days',
        waterRequirement: 'Medium (400-600mm)',
        soilType: 'Well-drained loamy',
        temperature: '18-27°C',
        humidity: '50-70%',
        ph: '6.0-7.0',
        nitrogen: '100-150 kg/ha',
        phosphorus: '50-80 kg/ha',
        potassium: '100-150 kg/ha',
        yield: '40-60 tons/hectare',
        marketPrice: '₹800-2,500/quintal',
        tips: [
            'Staking improves fruit quality',
            'Maintain consistent moisture to prevent cracking',
            'Prune suckers for better yield'
        ],
        diseases: ['Early Blight', 'Leaf Curl', 'Fusarium Wilt'],
        image: '/images/crops/tomato.jpg'
    },
    soybean: {
        name: 'Soybean',
        scientificName: 'Glycine max',
        season: 'Kharif (June-July)',
        duration: '90-120 days',
        waterRequirement: 'Medium (450-700mm)',
        soilType: 'Well-drained loamy',
        temperature: '20-30°C',
        humidity: '60-70%',
        ph: '6.0-7.5',
        nitrogen: '20-30 kg/ha',
        phosphorus: '60-80 kg/ha',
        potassium: '40-60 kg/ha',
        yield: '1.5-2.5 tons/hectare',
        marketPrice: '₹4,300/quintal (MSP)',
        tips: [
            'Inoculate seeds with Rhizobium for nitrogen fixation',
            'Avoid waterlogging during germination',
            'Timely harvesting prevents shattering losses'
        ],
        diseases: ['Rust', 'Yellow Mosaic', 'Collar Rot'],
        image: '/images/crops/soybean.jpg'
    }
};

/**
 * AI Crop Recommendation Algorithm
 * Based on soil parameters and climate conditions
 */
const recommendCrop = (params) => {
    const { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall } = params;
    
    const crops = Object.keys(cropDatabase);
    const scores = {};
    
    crops.forEach(crop => {
        let score = 0;
        const cropData = cropDatabase[crop];
        
        // Temperature score
        const tempRange = cropData.temperature.match(/(\d+)-(\d+)/);
        if (tempRange) {
            const [, min, max] = tempRange;
            if (temperature >= parseInt(min) && temperature <= parseInt(max)) {
                score += 20;
            } else if (temperature >= parseInt(min) - 5 && temperature <= parseInt(max) + 5) {
                score += 10;
            }
        }
        
        // Humidity score
        const humRange = cropData.humidity.match(/(\d+)-(\d+)/);
        if (humRange) {
            const [, min, max] = humRange;
            if (humidity >= parseInt(min) && humidity <= parseInt(max)) {
                score += 15;
            } else if (humidity >= parseInt(min) - 10 && humidity <= parseInt(max) + 10) {
                score += 7;
            }
        }
        
        // pH score
        const phRange = cropData.ph.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
        if (phRange) {
            const [, min, max] = phRange;
            if (ph >= parseFloat(min) && ph <= parseFloat(max)) {
                score += 20;
            } else if (ph >= parseFloat(min) - 0.5 && ph <= parseFloat(max) + 0.5) {
                score += 10;
            }
        }
        
        // NPK scores (simplified)
        if (nitrogen) {
            if (nitrogen > 80) score += 10;
            else if (nitrogen > 40) score += 15;
            else score += 5;
        }
        
        if (phosphorus) {
            if (phosphorus > 40) score += 10;
            else if (phosphorus > 20) score += 15;
            else score += 5;
        }
        
        if (potassium) {
            if (potassium > 40) score += 10;
            else if (potassium > 20) score += 15;
            else score += 5;
        }
        
        // Rainfall consideration
        if (rainfall) {
            const waterReq = cropData.waterRequirement.toLowerCase();
            if (waterReq.includes('high') && rainfall > 1000) score += 10;
            else if (waterReq.includes('medium') && rainfall > 500 && rainfall <= 1000) score += 10;
            else if (waterReq.includes('low') && rainfall <= 500) score += 10;
        }
        
        scores[crop] = score;
    });
    
    // Sort by score and get top recommendations
    const sorted = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    
    return sorted.map(([crop, score]) => ({
        crop,
        ...cropDatabase[crop],
        matchScore: Math.min(Math.round((score / 100) * 100), 98),
        confidence: score > 70 ? 'High' : score > 50 ? 'Medium' : 'Low'
    }));
};

/**
 * Get crop recommendation
 * POST /api/crop-recommendation
 */
exports.getRecommendation = async (req, res, next) => {
    try {
        const { 
            nitrogen = 50, 
            phosphorus = 50, 
            potassium = 50, 
            temperature = 25, 
            humidity = 70, 
            ph = 6.5, 
            rainfall = 800,
            location,
            soilType
        } = req.body;
        
        // Get recommendations
        const recommendations = recommendCrop({
            nitrogen: parseFloat(nitrogen),
            phosphorus: parseFloat(phosphorus),
            potassium: parseFloat(potassium),
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            ph: parseFloat(ph),
            rainfall: parseFloat(rainfall)
        });
        
        // Log to history if user is authenticated
        if (req.user) {
            await History.addEntry(req.user._id, 'crop-recommendation', {
                formData: req.body,
                result: recommendations[0]?.crop,
                location
            });
        }
        
        logger.info(`Crop recommendation generated: ${recommendations[0]?.crop}`);
        
        return successResponse(res, {
            recommendations,
            topRecommendation: recommendations[0],
            inputParameters: {
                nitrogen,
                phosphorus,
                potassium,
                temperature,
                humidity,
                ph,
                rainfall,
                location,
                soilType
            }
        }, 'Crop recommendations generated successfully');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get recommendation history
 * GET /api/crop-recommendation/history
 */
exports.getHistory = async (req, res, next) => {
    try {
        const history = await History.getUserHistory(req.user._id, {
            type: 'crop-recommendation',
            limit: parseInt(req.query.limit) || 20
        });
        
        return successResponse(res, { history }, 'History retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get crop details
 * GET /api/crop-recommendation/details/:crop
 */
exports.getCropDetails = async (req, res, next) => {
    try {
        const { crop } = req.params;
        const cropKey = crop.toLowerCase();
        
        if (!cropDatabase[cropKey]) {
            return next(new AppError('Crop not found', 404, 'CROP_NOT_FOUND'));
        }
        
        return successResponse(res, {
            crop: {
                id: cropKey,
                ...cropDatabase[cropKey]
            }
        }, 'Crop details retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get all crops
 * GET /api/crop-recommendation/list
 */
exports.getAllCrops = async (req, res, next) => {
    try {
        const crops = Object.entries(cropDatabase).map(([id, data]) => ({
            id,
            name: data.name,
            season: data.season,
            duration: data.duration,
            image: data.image
        }));
        
        return successResponse(res, { crops }, 'Crops list retrieved');
        
    } catch (error) {
        next(error);
    }
};
