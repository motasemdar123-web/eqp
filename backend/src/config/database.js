const { Client } = require('pg');
const { env } = require('./env');
const { getDatabaseUrl } = require('./prisma');

const databaseUrl = getDatabaseUrl();
const client = new Client({
  ...(databaseUrl ? { connectionString: databaseUrl } : env.db),
  ssl: {
    rejectUnauthorized: false,
  },
});

let connected = false;

async function connectDatabase() {
  if (connected) return client;

  await client.connect();
  connected = true;
  console.log('Connected to PostgreSQL');

  return client;
}

function query(text, params) {
  return client.query(text, params);
}

module.exports = {
  client,
  connectDatabase,
  query,
};
