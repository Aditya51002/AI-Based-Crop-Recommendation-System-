/**
 * Disease Detection Routes
 * AI-based plant disease detection endpoints
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const diseaseController = require('../controllers/disease.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/diseases'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Detect disease from image (works with or without auth)
router.post('/', optionalAuth, upload.single('image'), diseaseController.detectDisease);

// Get detection history (requires auth)
router.get('/history', protect, diseaseController.getHistory);

// Get disease details
router.get('/details/:disease', diseaseController.getDiseaseDetails);

// Get all known diseases
router.get('/list', diseaseController.getAllDiseases);

module.exports = router;
