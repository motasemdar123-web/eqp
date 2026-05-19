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
let client = null;
let connected = false;
let connecting = null;

function createClient() {
  const nextClient = new Client({
    ...(databaseUrl ? { connectionString: buildPgConnectionString(databaseUrl) } : env.db),
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  nextClient.on('error', (error) => {
    connected = false;
    connecting = null;
    console.error('PostgreSQL connection error', error);
  });

  nextClient.on('end', () => {
    connected = false;
    connecting = null;
  });

  return nextClient;
}

async function connectDatabase() {
  if (connected) return client;
  if (connecting) return connecting;

  client = createClient();
  connecting = client.connect()
    .then(() => {
      connected = true;
      connecting = null;
      console.log('Connected to PostgreSQL');
      return client;
    })
    .catch((error) => {
      connected = false;
      connecting = null;
      client = null;
      throw error;
    });

  return connecting;
}

async function query(text, params) {
  const activeClient = await connectDatabase();
  try {
    return await activeClient.query(text, params);
  } catch (error) {
    if (['ECONNRESET', 'ECONNREFUSED', '57P01', '08006'].includes(error.code)) {
      connected = false;
      connecting = null;
      client = null;
    }
    throw error;
  }
}

module.exports = {
  get client() {
    return client;
  },
  connectDatabase,
  query,
};
