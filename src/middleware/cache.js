const config = require('../config');

/**
 * Middleware to set cache headers for CDN and browser caching
 */
function setCacheHeaders(req, res, next) {
  // Set cache control headers for optimal CDN performance
  res.set({
    'Cache-Control': `public, max-age=${config.cache.maxAge}, s-maxage=${config.cache.sMaxAge}, immutable`,
    'Vary': 'Accept, Accept-Encoding',
  });

  next();
}

/**
 * Middleware to prevent caching (for API responses)
 */
function noCache(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  next();
}

/**
 * Middleware to set ETag based on file stats
 */
function setETag(stats) {
  return `"${stats.size}-${stats.mtime.getTime()}"`;
}

module.exports = {
  setCacheHeaders,
  noCache,
  setETag,
};
