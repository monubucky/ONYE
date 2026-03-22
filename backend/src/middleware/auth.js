const logger = require('../utils/logger');

function apiKeyAuth(req, res, next) {
  // Allow health check without auth
  if (req.path === '/health') return next();

  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Pass via X-API-Key header or api_key query param.',
    });
  }

  if (apiKey !== process.env.API_SECRET_KEY) {
    logger.warn(`Invalid API key attempt from ${req.ip}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key.',
    });
  }

  next();
}

module.exports = { apiKeyAuth };
