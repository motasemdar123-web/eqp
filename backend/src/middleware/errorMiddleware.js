const { ApiError } = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Route not found'));
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const isApiError = error instanceof ApiError || Boolean(error.statusCode);

  if (isServerError) {
    console.error(error);
  } else {
    console.warn(error.message);
  }

  res.status(statusCode).json({
    success: false,
    error: isServerError && isProduction && !isApiError
      ? 'Internal server error'
      : error.message || 'Internal server error',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
