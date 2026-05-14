const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

function getJwtSecret() {
  return env.security.appSecret || env.supabase.serviceRoleKey || env.db.password || 'development-only-platform-secret';
}

function signJwt(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
}

function verifyPlatformJwt(token) {
  return jwt.verify(token, getJwtSecret());
}

function requirePlatformAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required');
    }

    req.platformUser = verifyPlatformJwt(token);
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.platformUser?.permissions || [];

    if (!permissions.includes(permission) && !permissions.includes('SYSTEM_CONFIGURE')) {
      next(new ApiError(403, 'Permission denied'));
      return;
    }

    next();
  };
}

module.exports = {
  signJwt,
  verifyPlatformJwt,
  requirePlatformAuth,
  requirePermission,
};
