let prisma = null;

function isLocalDatabaseHost(host) {
  return ['localhost', '127.0.0.1', '::1', 'postgres'].includes(String(host || '').toLowerCase());
}

function buildDatabaseUrlFromLegacyEnv() {
  const {
    DB_HOST,
    DB_PORT = '5432',
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_SSLMODE,
  } = process.env;

  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    return null;
  }

  const databaseUrl = new URL(
    `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  );

  const sslMode = DB_SSLMODE || (isLocalDatabaseHost(DB_HOST) ? '' : 'require');

  if (sslMode) {
    databaseUrl.searchParams.set('sslmode', sslMode);
  }

  return databaseUrl.toString();
}

function getDatabaseUrl() {
  let url = process.env.DATABASE_URL || buildDatabaseUrlFromLegacyEnv();
  if (url && !url.includes('connection_limit=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}connection_limit=5`;
  }
  return url;
}

function getPrisma() {
  if (prisma) return prisma;

  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  const { PrismaClient } = require('@prisma/client');

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  return prisma;
}

module.exports = { getPrisma, getDatabaseUrl };
