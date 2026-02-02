/**
 * Error Handler Middleware
 * Central error handling for the application
 */

const logger = require('../utils/logger');

/**
 * Custom Error Class
 */
class AppError extends Error {
    constructor(message, statusCode, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error Handler
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => ({
        field: el.path,
        message: el.message
    }));
    
    return new AppError('Validation failed', 400, 'VALIDATION_ERROR');
};

/**
 * Duplicate Key Error Handler
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`${field} already exists`, 409, 'DUPLICATE_KEY');
};

/**
 * JWT Error Handler
 */
const handleJWTError = () => {
    return new AppError('Invalid token. Please login again', 401, 'INVALID_TOKEN');
};

/**
 * JWT Expired Error Handler
 */
const handleJWTExpiredError = () => {
    return new AppError('Token expired. Please login again', 401, 'TOKEN_EXPIRED');
};

/**
 * Cast Error Handler (Invalid MongoDB ID)
 */
const handleCastError = (err) => {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_ID');
};

/**
 * Development Error Response
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            code: err.code || 'ERROR',
            message: err.message,
            stack: err.stack,
            error: err
        }
    });
};

/**
 * Production Error Response
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message
            }
        });
    } else {
        // Programming or other unknown error: don't leak error details
        logger.error('UNEXPECTED ERROR:', err);
        
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Something went wrong. Please try again later.'
            }
        });
    }
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    
    // Log the error
    if (err.statusCode >= 500) {
        logger.error(`[${req.method}] ${req.path} - ${err.message}`, {
            error: err.stack,
            body: req.body,
            user: req.user?.id
        });
    } else {
        logger.warn(`[${req.method}] ${req.path} - ${err.message}`);
    }
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        
        // Handle specific error types
        if (err.name === 'ValidationError') error = handleValidationError(err);
        if (err.code === 11000) error = handleDuplicateKeyError(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
        if (err.name === 'CastError') error = handleCastError(err);
        
        sendErrorProd(error, res);
    }
};

module.exports = { errorHandler, AppError };
