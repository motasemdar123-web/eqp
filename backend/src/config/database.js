const { Client } = require('pg');
const { env } = require('./env');
const { getDatabaseUrl } = require('./prisma');

function isLocalDatabaseHost(host) {
  return ['localhost', '127.0.0.1', '::1', 'postgres'].includes(String(host || '').toLowerCase());
}

function databaseHostFromUrl(databaseUrl) {
  if (!databaseUrl) return env.db.host;

  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return env.db.host;
  }
}

function buildPgConnectionString(databaseUrl) {
  if (!databaseUrl) return null;

  try {
    const parsedUrl = new URL(databaseUrl);
    parsedUrl.searchParams.delete('sslmode');
    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
}

function shouldUseSsl(databaseUrl) {
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true') return true;

  return !isLocalDatabaseHost(databaseHostFromUrl(databaseUrl));
}

const databaseUrl = getDatabaseUrl();
const useSsl = shouldUseSsl(databaseUrl);
const client = new Client({
  ...(databaseUrl ? { connectionString: buildPgConnectionString(databaseUrl) } : env.db),
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
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
