const config = require('../config');

/**
 * Middleware to check API key for protected routes
 * If no API key is configured, all requests are allowed
 */
function requireApiKey(req, res, next) {
  // If no API key is configured, skip authentication
  if (!config.apiKey) {
    return next();
  }

  const providedKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!providedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Provide it via X-API-Key header or apiKey query parameter.',
    });
  }

  if (providedKey !== config.apiKey) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key.',
    });
  }

  next();
}

module.exports = {
  requireApiKey,
};
