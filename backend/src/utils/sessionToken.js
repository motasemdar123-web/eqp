const crypto = require('crypto');
const { env } = require('../config/env');
const { ApiError } = require('./ApiError');

const TOKEN_VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 60 * 60 * 12;

function getSigningSecret() {
  if (env.security.appSecret) return env.security.appSecret;

  const fallbackSecret =
    env.supabase.serviceRoleKey ||
    env.db.password;

  if (fallbackSecret) {
    console.warn('APP_SECRET is not set. Falling back to an existing server-side secret for session signing.');
    return fallbackSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new ApiError(500, 'Server session configuration is missing.');
  }

  console.warn('APP_SECRET is not set. Using development-only session signing secret.');
  return 'development-only-eqp-session-secret';
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
}

function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode({
    sub: user.id,
    userNumber: user.user_number,
    fullName: user.full_name,
    iat: now,
    exp: now + DEFAULT_TTL_SECONDS,
  });
  const signature = signPayload(payload);

  return `${TOKEN_VERSION}.${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    throw new ApiError(401, 'Authentication required');
  }

  const [version, payload, signature] = token.split('.');

  if (version !== TOKEN_VERSION || !payload || !signature) {
    throw new ApiError(401, 'Invalid session token');
  }

  const expectedSignature = signPayload(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new ApiError(401, 'Invalid session token');
  }

  let session;

  try {
    session = base64UrlDecode(payload);
  } catch {
    throw new ApiError(401, 'Invalid session token');
  }
  const now = Math.floor(Date.now() / 1000);

  if (!session.exp || session.exp < now) {
    throw new ApiError(401, 'Session expired');
  }

  return session;
}

module.exports = {
  createSessionToken,
  verifySessionToken,
};
