const express = require('express');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const {
  helmet,
  buildCorsMiddleware,
  generalRateLimit,
} = require('./middleware/securityMiddleware');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(buildCorsMiddleware());
  app.use(generalRateLimit);
  app.use(express.json({ limit: '2mb' }));

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
