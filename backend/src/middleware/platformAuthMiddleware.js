const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

function getJwtSecret() {
  return env.security.appSecret || env.supabase.serviceRoleKey || env.db.password || 'development-only-platform-secret';
}

function signJwt(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

function verifyPlatformJwt(token) {
  return jwt.verify(token, getJwtSecret());
}

// Signature must verify; expiry is allowed up to the same 30-day grace period requirePlatformAuth uses.
function verifyPlatformJwtWithGrace(token) {
  const decoded = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true });
  if (decoded.exp && (Date.now() / 1000 - decoded.exp) >= 86400 * 30) {
    throw new ApiError(401, 'Session expired');
  }
  return decoded;
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
      let resolvedUser = null;

      // 1. If signed JWT is expired, allow up to 30 days grace period for enterprise staff
      try {
        const decoded = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true });
        if (decoded && (!decoded.exp || (Date.now() / 1000 - decoded.exp) < 86400 * 30)) {
          resolvedUser = decoded;
        }
      } catch {}

      // 2. Check sessionToken (v1.payload.sig)
      if (!resolvedUser) {
        try {
          const { verifySessionToken } = require('../utils/sessionToken');
          const sessionUser = verifySessionToken(token);
          resolvedUser = {
            sub: sessionUser.sub || sessionUser.id,
            userNumber: sessionUser.userNumber || sessionUser.user_number,
            fullName: sessionUser.fullName || sessionUser.full_name,
            email: sessionUser.email,
            roles: sessionUser.roles || ['ENGINEER'],
            permissions: sessionUser.permissions || ['EQP_MANAGE', 'REPORTS_READ', 'REPORTS_WRITE'],
          };
        } catch {}
      }

      // Unsigned tokens are never trusted: only the signed paths above may resolve a user.
      if (resolvedUser) {
        req.platformUser = resolvedUser;
        req.user = resolvedUser;
        return next();
      }

      next(jwtErr.statusCode ? jwtErr : new ApiError(401, 'Invalid or expired token'));
      return;
    }
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

function optionalPlatformAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        req.platformUser = verifyPlatformJwt(token);
      } catch {
        try {
          const decoded = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true });
          if (decoded) req.platformUser = decoded;
        } catch {}
      }
    }
  } catch {}
  next();
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
  verifyPlatformJwtWithGrace,
  requirePlatformAuth,
  optionalPlatformAuth,
  requirePermission,
};
