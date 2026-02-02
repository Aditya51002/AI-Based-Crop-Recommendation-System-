/**
 * Disease Detection Controller
 * AI-based plant disease detection
 */

const fs = require('fs');
const path = require('path');
const History = require('../models/History');
const { AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Disease database
const diseaseDatabase = {
    'apple_scab': {
        name: 'Apple Scab',
        scientificName: 'Venturia inaequalis',
        crop: 'Apple',
        symptoms: [
            'Olive-green to brown lesions on leaves',
            'Dark, scabby spots on fruits',
            'Leaves may curl and fall prematurely',
            'Fruit may become cracked and deformed'
        ],
        causes: [
            'Fungal infection spreading through rain and wind',
            'Overwinters in fallen leaves',
            'Favored by cool, wet weather'
        ],
        treatment: [
            'Apply fungicides before rain events',
            'Remove and destroy fallen leaves',
            'Prune to improve air circulation',
            'Plant resistant varieties'
        ],
        prevention: [
            'Choose resistant apple varieties',
            'Maintain good orchard sanitation',
            'Apply preventive fungicide sprays',
            'Ensure proper spacing between trees'
        ],
        severity: 'Moderate',
        image: '/images/diseases/apple_scab.jpg'
    },
    'tomato_late_blight': {
        name: 'Late Blight',
        scientificName: 'Phytophthora infestans',
        crop: 'Tomato/Potato',
        symptoms: [
            'Dark, water-soaked lesions on leaves',
            'White fuzzy growth on leaf undersides',
            'Brown/black lesions on stems',
            'Fruit rot with firm, brown areas'
        ],
        causes: [
            'Oomycete pathogen',
            'Spreads rapidly in cool, wet conditions',
            'Can devastate crops within days'
        ],
        treatment: [
            'Apply copper-based fungicides',
            'Remove and destroy infected plants',
            'Do not compost infected material',
            'Apply chlorothalonil or mancozeb'
        ],
        prevention: [
            'Use certified disease-free transplants',
            'Avoid overhead irrigation',
            'Ensure good air circulation',
            'Monitor weather conditions'
        ],
        severity: 'High',
        image: '/images/diseases/late_blight.jpg'
    },
    'rice_blast': {
        name: 'Rice Blast',
        scientificName: 'Magnaporthe oryzae',
        crop: 'Rice',
        symptoms: [
            'Diamond-shaped lesions with gray centers',
            'Brown margins on lesions',
            'Neck rot causing panicle to break',
            'Nodes may turn black'
        ],
        causes: [
            'Fungal pathogen',
            'High nitrogen fertilization',
            'Prolonged leaf wetness',
            'Cool temperatures with high humidity'
        ],
        treatment: [
            'Apply tricyclazole or isoprothiolane',
            'Reduce nitrogen application',
            'Drain fields periodically',
            'Remove crop residue after harvest'
        ],
        prevention: [
            'Use resistant varieties',
            'Balanced fertilizer application',
            'Proper water management',
            'Seed treatment with fungicides'
        ],
        severity: 'High',
        image: '/images/diseases/rice_blast.jpg'
    },
    'wheat_rust': {
        name: 'Wheat Rust',
        scientificName: 'Puccinia spp.',
        crop: 'Wheat',
        symptoms: [
            'Orange-red pustules on leaves and stems',
            'Pustules release rusty spores',
            'Yellowing and drying of leaves',
            'Reduced grain filling'
        ],
        causes: [
            'Fungal pathogens (multiple species)',
            'Wind-dispersed spores',
            'Warm, humid conditions',
            'Dense crop canopy'
        ],
        treatment: [
            'Apply propiconazole or tebuconazole',
            'Foliar fungicide at first sign',
            'Multiple applications may be needed',
            'Destroy volunteer wheat plants'
        ],
        prevention: [
            'Plant resistant varieties',
            'Early sowing to escape disease',
            'Avoid excessive nitrogen',
            'Monitor for early symptoms'
        ],
        severity: 'High',
        image: '/images/diseases/wheat_rust.jpg'
    },
    'cotton_leaf_curl': {
        name: 'Cotton Leaf Curl Virus',
        scientificName: 'CLCuV (Begomovirus)',
        crop: 'Cotton',
        symptoms: [
            'Upward curling of leaves',
            'Thickening of leaf veins',
            'Enations on underside of leaves',
            'Stunted plant growth'
        ],
        causes: [
            'Viral disease transmitted by whiteflies',
            'Begomoviruses complex',
            'High whitefly population'
        ],
        treatment: [
            'No cure for viral diseases',
            'Control whitefly vectors',
            'Apply imidacloprid or thiamethoxam',
            'Remove and destroy infected plants'
        ],
        prevention: [
            'Plant resistant varieties',
            'Early sowing to avoid peak whitefly',
            'Control weeds that harbor whiteflies',
            'Use yellow sticky traps'
        ],
        severity: 'High',
        image: '/images/diseases/cotton_leaf_curl.jpg'
    },
    'potato_early_blight': {
        name: 'Early Blight',
        scientificName: 'Alternaria solani',
        crop: 'Potato/Tomato',
        symptoms: [
            'Dark brown spots with concentric rings',
            'Target-board pattern on leaves',
            'Lower leaves affected first',
            'Premature defoliation'
        ],
        causes: [
            'Fungal pathogen',
            'Warm, humid conditions',
            'Stressed or older plants',
            'Overwinters in plant debris'
        ],
        treatment: [
            'Apply mancozeb or chlorothalonil',
            'Remove infected leaves',
            'Improve plant nutrition',
            'Apply fungicides preventively'
        ],
        prevention: [
            'Use certified disease-free seed',
            'Crop rotation (3 years)',
            'Adequate potassium nutrition',
            'Avoid overhead irrigation'
        ],
        severity: 'Moderate',
        image: '/images/diseases/early_blight.jpg'
    },
    'healthy': {
        name: 'Healthy Plant',
        scientificName: 'N/A',
        crop: 'Various',
        symptoms: ['No disease symptoms detected'],
        causes: ['Plant appears healthy'],
        treatment: ['No treatment needed'],
        prevention: [
            'Continue good agricultural practices',
            'Monitor regularly for early signs',
            'Maintain proper nutrition',
            'Ensure adequate water management'
        ],
        severity: 'None',
        image: '/images/diseases/healthy.jpg'
    }
};

/**
 * Simulated AI disease detection
 * In production, this would call an actual ML model
 */
const detectDiseaseFromImage = async (imagePath) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get random disease for demo (in production, use actual ML model)
    const diseases = Object.keys(diseaseDatabase);
    const randomIndex = Math.floor(Math.random() * diseases.length);
    const detectedDisease = diseases[randomIndex];
    
    // Generate confidence score
    const confidence = 75 + Math.random() * 20; // 75-95%
    
    return {
        disease: detectedDisease,
        confidence: parseFloat(confidence.toFixed(2)),
        data: diseaseDatabase[detectedDisease]
    };
};

/**
 * Detect disease from uploaded image
 * POST /api/disease-detection
 */
exports.detectDisease = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload an image', 400, 'IMAGE_REQUIRED'));
        }
        
        const imagePath = req.file.path;
        
        // Detect disease
        const result = await detectDiseaseFromImage(imagePath);
        
        // Log to history if user is authenticated
        if (req.user) {
            await History.addEntry(req.user._id, 'disease-detection', {
                disease: result.disease,
                confidence: result.confidence,
                imagePath: req.file.filename
            });
        }
        
        logger.info(`Disease detected: ${result.data.name} (${result.confidence}%)`);
        
        return successResponse(res, {
            detection: {
                disease: result.disease,
                name: result.data.name,
                scientificName: result.data.scientificName,
                confidence: result.confidence,
                severity: result.data.severity,
                crop: result.data.crop
            },
            details: result.data,
            imageUrl: `/uploads/diseases/${req.file.filename}`
        }, 'Disease detection completed');
        
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
 * Get detection history
 * GET /api/disease-detection/history
 */
exports.getHistory = async (req, res, next) => {
    try {
        const history = await History.getUserHistory(req.user._id, {
            type: 'disease-detection',
            limit: parseInt(req.query.limit) || 20
        });
        
        return successResponse(res, { history }, 'History retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get disease details
 * GET /api/disease-detection/details/:disease
 */
exports.getDiseaseDetails = async (req, res, next) => {
    try {
        const { disease } = req.params;
        const diseaseKey = disease.toLowerCase().replace(/-/g, '_');
        
        if (!diseaseDatabase[diseaseKey]) {
            return next(new AppError('Disease not found', 404, 'DISEASE_NOT_FOUND'));
        }
        
        return successResponse(res, {
            disease: {
                id: diseaseKey,
                ...diseaseDatabase[diseaseKey]
            }
        }, 'Disease details retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get all diseases
 * GET /api/disease-detection/list
 */
exports.getAllDiseases = async (req, res, next) => {
    try {
        const diseases = Object.entries(diseaseDatabase)
            .filter(([id]) => id !== 'healthy')
            .map(([id, data]) => ({
                id,
                name: data.name,
                crop: data.crop,
                severity: data.severity,
                image: data.image
            }));
        
        return successResponse(res, { diseases }, 'Diseases list retrieved');
        
    } catch (error) {
        next(error);
    }
};
