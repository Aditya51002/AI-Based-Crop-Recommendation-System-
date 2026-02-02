/**
 * Response Helper Utilities
 * Standardized API response formatting
 */

/**
 * Success Response
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Created Response
 */
const createdResponse = (res, data = null, message = 'Created successfully') => {
    return successResponse(res, data, message, 201);
};

/**
 * Error Response
 */
const errorResponse = (res, message = 'Error occurred', statusCode = 400, code = 'ERROR') => {
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message
        }
    });
};

/**
 * Paginated Response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: Math.ceil(pagination.total / pagination.limit)
        }
    });
};

module.exports = {
    successResponse,
    createdResponse,
    errorResponse,
    paginatedResponse
};
