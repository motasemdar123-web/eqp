const { verifySessionToken } = require('../utils/sessionToken');
const { verifyPlatformJwt } = require('./platformAuthMiddleware');
const { ApiError } = require('../utils/ApiError');

const publicApiPaths = new Set([
  '/api/auth/login',
  '/api/auth/unified-login',
  '/api/auth/technician-login',
  '/api/auth/microsoft/start',
  '/api/auth/microsoft/callback',
  '/api/auth/microsoft/session',
]);

function isPublicApiPath(path) {
  return publicApiPaths.has(path);
}

function requireInternalApiAuth(req, res, next) {
  if (req.method === 'OPTIONS' || !req.path.startsWith('/api/')) {
    next();
    return;
  }

  if (isPublicApiPath(req.path)) {
    next();
    return;
  }

  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required');
    }

    try {
      req.platformUser = verifyPlatformJwt(token);
      req.user = {
        sub: req.platformUser.sub,
        userNumber: req.platformUser.userNumber,
        fullName: req.platformUser.fullName,
        email: req.platformUser.email,
        roles: req.platformUser.roles || [],
        permissions: req.platformUser.permissions || [],
      };
    } catch (platformError) {
      req.user = verifySessionToken(token);
    }

    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = {
  requireInternalApiAuth,
};
