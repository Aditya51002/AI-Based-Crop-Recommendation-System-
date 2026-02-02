/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */

const { AppError } = require('./errorHandler');

const notFound = (req, res, next) => {
    const error = new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
};

module.exports = notFound;
