const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyPlatformJwt } = require('./platformAuthMiddleware');
const { verifySessionToken } = require('../utils/sessionToken');
const { env } = require('../config/env');

const GRACE_SECONDS = 86400 * 30;

function getJwtSecret() {
  return env.security.appSecret || env.supabase.serviceRoleKey || env.db.password || 'development-only-platform-secret';
}

function matchesSyncToken(provided) {
  const expected = process.env.PDX_SYNC_TOKEN || '';
  if (!expected || !provided) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Only signature-verified identities: unlike the general platform auth, no unsigned payload fallback,
// because whoever writes this cookie decides whose PDX account every order is placed with.
function resolveSignedUser(token) {
  try {
    return verifyPlatformJwt(token);
  } catch {}
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true });
    if (decoded && (!decoded.exp || Date.now() / 1000 - decoded.exp < GRACE_SECONDS)) return decoded;
  } catch {}
  try {
    return verifySessionToken(token);
  } catch {}
  return null;
}

// Guards writes to the shared PDX session: the EQP extension sends X-PDX-Sync-Token, the web app sends its login token.
function requirePdxSessionWriter(req, res, next) {
  if (matchesSyncToken(req.get('x-pdx-sync-token'))) {
    req.pdxSessionWriter = 'sync-token';
    next();
    return;
  }

  const [scheme, token] = (req.get('authorization') || '').split(' ');
  const user = scheme === 'Bearer' && token ? resolveSignedUser(token) : null;
  if (user) {
    req.platformUser = req.platformUser || user;
    req.pdxSessionWriter = user.email || user.sub || 'platform-user';
    next();
    return;
  }

  res.status(401).json({
    success: false,
    connected: false,
    message: process.env.PDX_SYNC_TOKEN
      ? 'Not authorized to update the PDX session. Check the sync token in the EQP extension.'
      : 'PDX_SYNC_TOKEN is not configured on the server; only signed-in users can update the PDX session.',
  });
}

module.exports = {
  requirePdxSessionWriter,
};
