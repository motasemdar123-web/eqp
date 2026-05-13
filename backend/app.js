require('dotenv').config();

const { createApp } = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { env } = require('./src/config/env');

async function startServer() {
  try {
    await connectDatabase();

    const app = createApp();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
