const crypto = require('crypto');
const { getPrisma } = require('../config/prisma');

const KEY_PREFIX = 'eqp_live_';

/**
 * Computes SHA-256 hash of an API key
 */
function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(String(rawKey || '').trim()).digest('hex');
}

/**
 * Creates and registers a new M2M API Key
 */
async function createApiKey({
  name,
  scopes = ['sap:read', 'sap:write'],
  allowedIps = [],
  role = 'SAP_INTEGRATION_SERVICE',
  expiresAt = null,
  createdById = null,
}) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database connection not available');

  const randomSecret = crypto.randomBytes(32).toString('hex');
  const rawKey = `${KEY_PREFIX}${randomSecret}`;
  const keyPrefix = rawKey.substring(0, 16);
  const keyHash = hashApiKey(rawKey);

  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      name,
      keyPrefix,
      keyHash,
      scopes,
      allowedIps,
      role,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById,
    },
  });

  return {
    ...apiKeyRecord,
    rawKey, // Returned once so caller can provide to ABS
  };
}

/**
 * Validates raw bearer API key against database
 */
async function validateApiKey(rawKey, { requiredScope = null, clientIp = null } = {}) {
  const prisma = getPrisma();
  if (!prisma) return { valid: false, error: 'Database unavailable' };
  if (!rawKey) return { valid: false, error: 'Missing API key' };

  const keyHash = hashApiKey(rawKey);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is deactivated' };
  }

  if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
    return { valid: false, error: 'API key has expired' };
  }

  if (Array.isArray(apiKey.allowedIps) && apiKey.allowedIps.length > 0 && clientIp) {
    const normClientIp = String(clientIp || '').trim().replace(/^::ffff:/, '');
    const isWhitelisted = apiKey.allowedIps.some((ip) => {
      let cleanIp = String(ip || '').trim().replace(/^::ffff:/, '');
      if (cleanIp === '*' || cleanIp === normClientIp) return true;
      if (
        (cleanIp === '127.0.0.1' || cleanIp === 'localhost') &&
        (normClientIp === '127.0.0.1' || normClientIp === '::1')
      ) {
        return true;
      }
      return false;
    });

    if (!isWhitelisted) {
      return { valid: false, error: `Client IP ${clientIp} not in allowed IP whitelist` };
    }
  }

  if (requiredScope && Array.isArray(apiKey.scopes)) {
    if (!apiKey.scopes.includes(requiredScope) && !apiKey.scopes.includes('*')) {
      return { valid: false, error: `Missing required scope: ${requiredScope}` };
    }
  }

  // Asynchronously record lastUsedAt
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => console.error('[apiKeyService] Failed to update lastUsedAt:', err.message));

  return { valid: true, apiKey };
}

/**
 * Asynchronously logs M2M API access
 */
async function logApiAccess({
  apiKeyId = null,
  endpoint,
  httpMethod,
  statusCode,
  ipAddress = null,
  userAgent = null,
  responseTimeMs = null,
  requestPayload = null,
  errorMessage = null,
}) {
  const prisma = getPrisma();
  if (!prisma) return;

  try {
    await prisma.apiAccessLog.create({
      data: {
        apiKeyId,
        endpoint,
        httpMethod,
        statusCode,
        ipAddress,
        userAgent,
        responseTimeMs,
        requestPayload:
          requestPayload && typeof requestPayload === 'object'
            ? requestPayload
            : requestPayload
            ? { raw: requestPayload }
            : null,
        errorMessage: errorMessage ? String(errorMessage).slice(0, 1000) : null,
      },
    });
  } catch (err) {
    console.error('[apiKeyService] Failed to create ApiAccessLog:', err.message);
  }
}

/**
 * List all API keys (without hashes or secret values)
 */
async function listApiKeys() {
  const prisma = getPrisma();
  if (!prisma) return [];

  return prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      allowedIps: true,
      role: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Revoke or deactivate an API key
 */
async function revokeApiKey(id) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database connection not available');

  return prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });
}

module.exports = {
  hashApiKey,
  createApiKey,
  validateApiKey,
  logApiAccess,
  listApiKeys,
  revokeApiKey,
};
