/**
 * Central error handling middleware
 * Catches all errors and sends standardized responses
 */

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Joi validation error
    if (err.isJoi) {
        error.message = err.details.map((d) => d.message).join(', ');
        error.statusCode = 400;
    }

    // PostgreSQL errors
    if (err.code === '23505') {
        // Duplicate key
        error.message = 'Duplicate entry found';
        error.statusCode = 409;
    }

    if (err.code === '23503') {
        // Foreign key violation
        error.message = 'Related resource not found';
        error.statusCode = 404;
    }

    if (err.code === '22P02') {
        // Invalid input syntax
        error.message = 'Invalid data format';
        error.statusCode = 400;
    }

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File size too large';
        error.statusCode = 400;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = 'Unexpected file field';
        error.statusCode = 400;
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

// Not found handler
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

export { errorHandler, notFound, AppError };
