const { verifySessionToken } = require('../utils/sessionToken');
const { verifyPlatformJwt } = require('./platformAuthMiddleware');
const { ApiError } = require('../utils/ApiError');

function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required');
    }

    try {
      req.user = verifySessionToken(token);
    } catch (sessionError) {
      const platformUser = verifyPlatformJwt(token);
      req.user = {
        sub: platformUser.sub,
        userNumber: platformUser.userNumber,
        fullName: platformUser.fullName,
        email: platformUser.email,
        roles: platformUser.roles || [],
        permissions: platformUser.permissions || [],
      };
    }

    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { requireAuth };
