const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
  checkperiod: 600,
  useClones: false,
});

/**
 * Generate a deterministic cache key from an object
 */
function generateCacheKey(prefix, data) {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  // Simple hash for cache key
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${prefix}_${Math.abs(hash)}`;
}

function get(key) {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
  }
  return value;
}

function set(key, value, ttl) {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
  logger.debug(`Cache SET: ${key}`);
}

function del(key) {
  cache.del(key);
  logger.debug(`Cache DEL: ${key}`);
}

function flush() {
  cache.flushAll();
  logger.info('Cache flushed');
}

function getStats() {
  return cache.getStats();
}

module.exports = { get, set, del, flush, getStats, generateCacheKey };
