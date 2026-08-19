require('dotenv').config();

const { createApp } = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { env } = require('./src/config/env');

async function startServer() {
  try {
    const app = createApp();

    const server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    server.on('error', (error) => {
      console.error('Failed to start server', error);
      process.exit(1);
    });

    connectDatabase().catch((error) => {
      console.error('PostgreSQL initial connection failed; API routes will retry on demand', error);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
