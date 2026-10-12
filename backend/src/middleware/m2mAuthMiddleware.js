const { validateApiKey, logApiAccess } = require('../services/apiKeyService');

/**
 * Extracts true client IP address
 */
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'];
  if (ip) {
    ip = ip.split(',')[0].trim();
  } else {
    ip = req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }
  if (typeof ip === 'string') {
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    if (ip === '::1') {
      ip = '127.0.0.1';
    }
  }
  return ip || '127.0.0.1';
}

/**
 * M2M Authentication Middleware for SAP Integration and ABS Partners
 * 
 * @param {string} [requiredScope] - e.g. 'sap:read', 'sap:write'
 */
function requireM2mAuth(requiredScope = null) {
  return async (req, res, next) => {
    const startTime = Date.now();
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    let apiKeyRecord = null;
    let authError = null;

    res.on('finish', () => {
      const responseTimeMs = Date.now() - startTime;
      logApiAccess({
        apiKeyId: apiKeyRecord ? apiKeyRecord.id : null,
        endpoint: req.originalUrl || req.url,
        httpMethod: req.method,
        statusCode: res.statusCode,
        ipAddress: clientIp,
        userAgent,
        responseTimeMs,
        requestPayload: req.method !== 'GET' ? req.body : null,
        errorMessage: authError,
      });
    });

    try {
      const authHeader = req.headers['authorization'] || '';
      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        authError = 'Missing or invalid Authorization header. Expected: Bearer <API_KEY>';
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: authError,
        });
      }

      const validation = await validateApiKey(token, { requiredScope, clientIp });
      if (!validation.valid) {
        authError = validation.error;
        const statusCode = validation.error.includes('whitelist') || validation.error.includes('scope') ? 403 : 401;
        return res.status(statusCode).json({
          success: false,
          error: statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED',
          message: validation.error,
        });
      }

      apiKeyRecord = validation.apiKey;
      req.apiKey = apiKeyRecord;
      req.clientIp = clientIp;
      next();
    } catch (err) {
      authError = err.message;
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Authentication processing failed',
      });
    }
  };
}

module.exports = {
  requireM2mAuth,
  getClientIp,
};
