const { ApiError } = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Route not found'));
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  console.error(error);

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
