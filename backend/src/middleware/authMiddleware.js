const { verifySessionToken } = require('../utils/sessionToken');
const { ApiError } = require('../utils/ApiError');

function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required');
    }

    req.user = verifySessionToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
