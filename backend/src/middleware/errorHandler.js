const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error:', err);

  // Anthropic API errors
  if (err.status && err.error) {
    return res.status(502).json({
      error: 'AI service error',
      message: err.message || 'Failed to get AI response',
      code: err.status,
    });
  }

  // JSON parse errors from AI
  if (err instanceof SyntaxError) {
    return res.status(502).json({
      error: 'AI response parsing error',
      message: 'Received invalid response from AI service',
    });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
