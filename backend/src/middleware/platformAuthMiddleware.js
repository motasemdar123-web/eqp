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

    try {
      req.platformUser = verifyPlatformJwt(token);
    } catch (jwtErr) {
      const { verifySessionToken } = require('../utils/sessionToken');
      const sessionUser = verifySessionToken(token);
      req.platformUser = {
        sub: sessionUser.sub || sessionUser.id,
        userNumber: sessionUser.userNumber || sessionUser.user_number,
        fullName: sessionUser.fullName || sessionUser.full_name,
        email: sessionUser.email,
        roles: sessionUser.roles || ['ENGINEER'],
        permissions: sessionUser.permissions || ['EQP_MANAGE', 'REPORTS_READ', 'REPORTS_WRITE'],
      };
      req.user = sessionUser;
    }
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
