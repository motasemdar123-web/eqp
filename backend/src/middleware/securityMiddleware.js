const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

function buildCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (!origin || env.security.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, 'Origin is not allowed by CORS'));
    },
  });
}

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again later.',
  },
});

const reportGenerationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many report generation requests. Please try again later.',
  },
});

module.exports = {
  helmet,
  buildCorsMiddleware,
  generalRateLimit,
  authRateLimit,
  reportGenerationRateLimit,
};
