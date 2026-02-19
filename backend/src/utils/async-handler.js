/**
 * Async handler wrapper to eliminate try-catch boilerplate
 * Wraps async route handlers and passes errors to Express error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
