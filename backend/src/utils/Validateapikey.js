const https = require('https');
const logger = require('./logger');

function validateOpenRouterKey() {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key || key.includes('your-key-here')) {
    logger.error('══════════════════════════════════════════════════');
    logger.error('  OPENROUTER_API_KEY is not set in backend/.env');
    logger.error('  Get a FREE key at: https://openrouter.ai/keys');
    logger.error('  No credit card required');
    logger.error('══════════════════════════════════════════════════');
    return;
  }

  const req = https.request(
    {
      hostname: 'openrouter.ai',
      path: '/api/v1/models',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` },
    },
    (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            logger.error(`══ OpenRouter key error: ${json.error.message}`);
            logger.error('  Fix: Get a new key at https://openrouter.ai/keys');
            return;
          }
          const freeModels = (json.data || [])
            .filter(m => m.id.endsWith(':free'))
            .map(m => m.id)
            .slice(0, 4);
          logger.info(`✓ OpenRouter key valid. Free models: ${freeModels.join(', ')}`);
        } catch (e) {
          logger.warn('Could not parse OpenRouter key validation response');
        }
      });
    }
  );
  req.on('error', e => logger.warn(`Could not reach OpenRouter: ${e.message}`));
  req.end();
}

module.exports = validateOpenRouterKey;