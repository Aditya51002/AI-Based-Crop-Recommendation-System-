/**
 * Enhanced Disease Detection Controller
 * Handles disease detection API with image upload and analysis
 */

const DiseaseDetection = require('../models/DiseaseDetection');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload and analyze disease image
 * POST /api/diseases/analyze
 */
exports.analyzeDiseaseImage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { cropType, location, symptoms } = req.body;
        
        // Check if image file was uploaded
        if (!req.file && !req.files) {
            return errorResponse(res, 'Disease image is required', 400);
        }
        
        const imageFile = req.file || (req.files && req.files.image);
        
        if (!imageFile) {
            return errorResponse(res, 'Disease image is required', 400);
        }
        
        // Validate image file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(imageFile.mimetype)) {
            return errorResponse(res, 'Only JPEG and PNG images are allowed', 400);
        }
        
        // Validate file size (5MB limit)
        if (imageFile.size > 5 * 1024 * 1024) {
            return errorResponse(res, 'Image size must be less than 5MB', 400);
        }
        
        // Mock disease detection analysis for immediate frontend testing
        const analysisResult = await performDiseaseAnalysis(imageFile, cropType, symptoms);
        
        // Create disease detection record
        const detectionRecord = new DiseaseDetection({
            userId,
            imagePath: imageFile.path || imageFile.filename,
            cropType: cropType || 'Unknown',
            symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : [],
            location: location ? {
                latitude: parseFloat(location.latitude) || null,
                longitude: parseFloat(location.longitude) || null
            } : null,
            analysis: analysisResult
        });
        
        await detectionRecord.save();
        
        logger.info(`Disease detection analysis completed for user: ${userId}`);
        
        return successResponse(res, {
            detectionId: detectionRecord._id,
            analysis: analysisResult,
            imagePath: imageFile.path || imageFile.filename
        }, 'Disease analysis completed successfully');
        
    } catch (error) {
        logger.error('Disease analysis error:', error);
        next(error);
    }
};

/**
 * Get disease detection history
 * GET /api/diseases/history
 */
exports.getDetectionHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        // Demo mode check
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            // Mock history data for demo
            const mockHistory = [
                {
                    id: 'demo-detection-1',
                    cropType: 'Tomato',
                    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    analysis: {
                        disease: 'Tomato Blight',
                        confidence: 0.92,
                        severity: 'Moderate',
                        treatmentRecommendations: [
                            'Remove affected leaves immediately',
                            'Apply copper-based fungicide',
                            'Improve air circulation around plants'
                        ]
                    }
                },
                {
                    id: 'demo-detection-2',
                    cropType: 'Rice',
                    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    analysis: {
                        disease: 'Rice Blast',
                        confidence: 0.87,
                        severity: 'Severe',
                        treatmentRecommendations: [
                            'Apply Tricyclazole fungicide',
                            'Ensure proper drainage',
                            'Reduce nitrogen fertilization'
                        ]
                    }
                }
            ];
            
            return successResponse(res, {
                history: mockHistory,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 2,
                    pages: 1
                }
            }, 'Detection history retrieved (Demo Mode)');
        }
        
        const history = await DiseaseDetection.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v -imagePath');
        
        const total = await DiseaseDetection.countDocuments({ userId });
        
        return successResponse(res, {
            history,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }, 'Detection history retrieved successfully');
        
    } catch (error) {
        logger.error('Get detection history error:', error);
        next(error);
    }
};

/**
 * Get detection details
 * GET /api/diseases/:detectionId
 */
exports.getDetectionDetails = async (req, res, next) => {
    try {
        const { detectionId } = req.params;
        const userId = req.user.id;
        
        const detection = await DiseaseDetection.findOne({
            _id: detectionId,
            userId
        });
        
        if (!detection) {
            return errorResponse(res, 'Detection record not found', 404);
        }
        
        return successResponse(res, {
            detection
        }, 'Detection details retrieved successfully');
        
    } catch (error) {
        logger.error('Get detection details error:', error);
        next(error);
    }
};

/**
 * Get disease information database
 * GET /api/diseases/info
 */
exports.getDiseaseInfo = async (req, res, next) => {
    try {
        const { crop, disease } = req.query;
        
        // Mock disease information database
        const diseaseDatabase = getDiseaseDatabase();
        
        let diseases = diseaseDatabase;
        
        // Filter by crop if provided
        if (crop) {
            diseases = diseases.filter(d => 
                d.affectedCrops.includes(crop.toLowerCase())
            );
        }
        
        // Filter by specific disease if provided
        if (disease) {
            diseases = diseases.filter(d => 
                d.name.toLowerCase().includes(disease.toLowerCase())
            );
        }
        
        return successResponse(res, {
            diseases: diseases.slice(0, 20) // Limit to 20 results
        }, 'Disease information retrieved successfully');
        
    } catch (error) {
        logger.error('Get disease info error:', error);
        next(error);
    }
};

/**
 * Save treatment feedback
 * POST /api/diseases/:detectionId/feedback
 */
exports.saveTreatmentFeedback = async (req, res, next) => {
    try {
        const { detectionId } = req.params;
        const userId = req.user.id;
        const { treatmentApplied, effectiveness, notes } = req.body;
        
        const detection = await DiseaseDetection.findOne({
            _id: detectionId,
            userId
        });
        
        if (!detection) {
            return errorResponse(res, 'Detection record not found', 404);
        }
        
        // Update detection with feedback
        detection.feedback = {
            treatmentApplied,
            effectiveness: parseFloat(effectiveness),
            notes,
            submittedAt: new Date()
        };
        
        await detection.save();
        
        logger.info(`Treatment feedback saved for detection: ${detectionId}`);
        
        return successResponse(res, {
            message: 'Feedback saved successfully'
        }, 'Treatment feedback saved');
        
    } catch (error) {
        logger.error('Save feedback error:', error);
        next(error);
    }
};

/**
 * Perform mock disease analysis
 */
async function performDiseaseAnalysis(imageFile, cropType, symptoms) {
    // This would be replaced with actual AI/ML disease detection in production
    
    const diseases = getDiseaseDatabase();
    
    // Filter diseases by crop type if provided
    let relevantDiseases = diseases;
    if (cropType) {
        relevantDiseases = diseases.filter(disease => 
            disease.affectedCrops.includes(cropType.toLowerCase())
        );
    }
    
    // If no crop-specific diseases, use common diseases
    if (relevantDiseases.length === 0) {
        relevantDiseases = diseases.slice(0, 5);
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select a random disease for demo
    const selectedDisease = relevantDiseases[Math.floor(Math.random() * relevantDiseases.length)];
    
    // Generate confidence score based on symptoms match
    let confidence = 0.7 + Math.random() * 0.25; // Base confidence 70-95%
    
    if (symptoms) {
        const symptomsList = symptoms.toLowerCase().split(',').map(s => s.trim());
        const matchingSymptoms = selectedDisease.symptoms.filter(symptom => 
            symptomsList.some(userSymptom => 
                symptom.toLowerCase().includes(userSymptom) || 
                userSymptom.includes(symptom.toLowerCase())
            )
        );
        
        if (matchingSymptoms.length > 0) {
            confidence = Math.min(0.98, confidence + (matchingSymptoms.length * 0.05));
        }
    }
    
    return {
        disease: selectedDisease.name,
        confidence: parseFloat(confidence.toFixed(2)),
        severity: getSeverityLevel(confidence),
        description: selectedDisease.description,
        symptoms: selectedDisease.symptoms,
        causes: selectedDisease.causes,
        treatmentRecommendations: selectedDisease.treatments,
        preventiveMeasures: selectedDisease.prevention,
        organicTreatments: selectedDisease.organicTreatments || [],
        imageAnalysis: {
            processedAt: new Date().toISOString(),
            fileSize: imageFile.size,
            confidence_breakdown: {
                visual_features: Math.round(confidence * 100 * 0.6),
                symptom_match: Math.round(confidence * 100 * 0.4)
            }
        }
    };
}

/**
 * Get severity level based on confidence
 */
function getSeverityLevel(confidence) {
    if (confidence >= 0.9) return 'Severe';
    if (confidence >= 0.75) return 'Moderate';
    if (confidence >= 0.6) return 'Mild';
    return 'Uncertain';
}

/**
 * Mock disease database
 */
function getDiseaseDatabase() {
    return [
        {
            name: 'Tomato Blight',
            affectedCrops: ['tomato'],
            description: 'A fungal disease that affects tomato plants, causing dark spots on leaves and fruits.',
            symptoms: ['Dark spots on leaves', 'Yellowing leaves', 'Brown lesions on fruits', 'Wilting'],
            causes: ['High humidity', 'Poor air circulation', 'Overhead watering'],
            treatments: [
                'Remove affected plant parts immediately',
                'Apply copper-based fungicide',
                'Improve air circulation',
                'Use drip irrigation instead of overhead watering'
            ],
            prevention: [
                'Plant resistant varieties',
                'Ensure proper spacing between plants',
                'Avoid watering leaves',
                'Rotate crops annually'
            ],
            organicTreatments: [
                'Neem oil spray',
                'Baking soda solution',
                'Compost tea application'
            ]
        },
        {
            name: 'Rice Blast',
            affectedCrops: ['rice'],
            description: 'A serious fungal disease of rice caused by Magnaporthe oryzae.',
            symptoms: ['Diamond-shaped lesions on leaves', 'Brown spots with yellow halos', 'Neck rot', 'Panicle blast'],
            causes: ['High humidity', 'Excessive nitrogen', 'Dense planting'],
            treatments: [
                'Apply Tricyclazole fungicide',
                'Use resistant varieties',
                'Improve field drainage',
                'Reduce nitrogen application'
            ],
            prevention: [
                'Use certified disease-free seeds',
                'Follow proper spacing',
                'Balanced fertilization',
                'Water management'
            ]
        },
        {
            name: 'Wheat Rust',
            affectedCrops: ['wheat'],
            description: 'Fungal diseases that appear as rust-colored pustules on wheat plants.',
            symptoms: ['Orange-red pustules on leaves', 'Yellow streaks', 'Black spores', 'Premature drying'],
            causes: ['Cool humid weather', 'Wind dispersal', 'Susceptible varieties'],
            treatments: [
                'Apply fungicide at first sign',
                'Use rust-resistant varieties',
                'Remove infected debris',
                'Early planting to avoid peak infection'
            ],
            prevention: [
                'Crop rotation',
                'Resistant cultivars',
                'Proper field sanitation',
                'Monitor weather conditions'
            ]
        },
        {
            name: 'Cotton Bollworm',
            affectedCrops: ['cotton'],
            description: 'A major pest of cotton that damages bolls and reduces yield.',
            symptoms: ['Holes in bolls', 'Damaged flowers', 'Frass around plants', 'Wilted buds'],
            causes: ['Adult moth egg laying', 'Warm weather', 'Continuous cotton cropping'],
            treatments: [
                'Bt cotton varieties',
                'Targeted insecticide application',
                'Pheromone traps',
                'Biological control agents'
            ],
            prevention: [
                'Regular monitoring',
                'Crop rotation',
                'Trap crops',
                'Natural predator conservation'
            ]
        },
        {
            name: 'Potato Late Blight',
            affectedCrops: ['potato'],
            description: 'Devastating disease caused by Phytophthora infestans affecting potato crops.',
            symptoms: ['Dark water-soaked spots', 'White fuzzy growth', 'Brown tuber rot', 'Plant collapse'],
            causes: ['Cool moist conditions', 'Poor air circulation', 'Infected seed tubers'],
            treatments: [
                'Copper-based fungicides',
                'Systemic fungicides',
                'Improve drainage',
                'Remove infected plants'
            ],
            prevention: [
                'Certified seed tubers',
                'Proper spacing',
                'Avoid overhead irrigation',
                'Hill planting for drainage'
            ]
        },
        {
            name: 'Corn Leaf Blight',
            affectedCrops: ['corn', 'maize'],
            description: 'Fungal disease affecting corn leaves and reducing photosynthesis.',
            symptoms: ['Long elliptical lesions', 'Gray-green spots', 'Yellowing leaves', 'Reduced yield'],
            causes: ['Warm humid weather', 'Continuous corn cropping', 'Infected crop residue'],
            treatments: [
                'Resistant hybrids',
                'Fungicide application',
                'Crop rotation',
                'Field sanitation'
            ],
            prevention: [
                'Use resistant varieties',
                'Rotate with non-host crops',
                'Bury crop residue',
                'Balanced nutrition'
            ]
        }
    ];
}

module.exports = exports;