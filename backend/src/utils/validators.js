/**
 * Validation Helpers
 * Common validation utilities
 */

const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validation Error Handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: errorMessages
            }
        });
    }
    next();
};

/**
 * Common Validators
 */
const validators = {
    // Phone validation
    phone: body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[+]?[0-9\s-]{10,15}$/).withMessage('Invalid phone number format'),
    
    // Password validation
    password: body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    
    // Simple password (less strict)
    simplePassword: body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    // Name validation
    name: body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    
    // Email validation
    email: body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    
    // OTP validation
    otp: body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must be numeric'),
    
    // Location validation
    location: body('location')
        .trim()
        .notEmpty().withMessage('Location is required'),
    
    // Crop name validation
    crop: body('crop')
        .trim()
        .notEmpty().withMessage('Crop name is required'),
    
    // Image file validation (for multer)
    image: body('image')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('Image file is required');
            }
            return true;
        })
};

/**
 * Validation Rules for Different Endpoints
 */
const validationRules = {
    login: [
        validators.phone,
        validators.simplePassword,
        handleValidationErrors
    ],
    
    register: [
        validators.name,
        validators.phone,
        validators.simplePassword,
        validators.email,
        handleValidationErrors
    ],
    
    verifyOtp: [
        validators.phone,
        validators.otp,
        handleValidationErrors
    ],
    
    cropRecommendation: [
        body('nitrogen').optional().isNumeric().withMessage('Nitrogen must be a number'),
        body('phosphorus').optional().isNumeric().withMessage('Phosphorus must be a number'),
        body('potassium').optional().isNumeric().withMessage('Potassium must be a number'),
        body('temperature').optional().isNumeric().withMessage('Temperature must be a number'),
        body('humidity').optional().isNumeric().withMessage('Humidity must be a number'),
        body('ph').optional().isNumeric().withMessage('pH must be a number'),
        body('rainfall').optional().isNumeric().withMessage('Rainfall must be a number'),
        handleValidationErrors
    ],
    
    chatbot: [
        body('message')
            .trim()
            .notEmpty().withMessage('Message is required')
            .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
        handleValidationErrors
    ]
};

module.exports = {
    handleValidationErrors,
    validators,
    validationRules
};
