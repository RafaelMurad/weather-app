const path = require('path');
const config = require('../config');

/**
 * Get the media type category from a MIME type
 */
function getMediaCategory(mimeType) {
  const { allowedMimeTypes } = config;

  if (allowedMimeTypes.images.includes(mimeType)) return 'images';
  if (allowedMimeTypes.videos.includes(mimeType)) return 'videos';
  if (allowedMimeTypes.documents.includes(mimeType)) return 'documents';

  return null;
}

/**
 * Check if a MIME type is allowed
 */
function isAllowedMimeType(mimeType) {
  return getMediaCategory(mimeType) !== null;
}

/**
 * Generate a unique filename while preserving the extension
 */
function generateUniqueFilename(originalName, uuid) {
  const ext = path.extname(originalName).toLowerCase();
  return `${uuid}${ext}`;
}

/**
 * Parse transformation parameters from query string
 */
function parseTransformParams(query) {
  const params = {};

  // Width
  if (query.w || query.width) {
    params.width = Math.min(
      parseInt(query.w || query.width),
      config.transform.maxWidth
    );
  }

  // Height
  if (query.h || query.height) {
    params.height = Math.min(
      parseInt(query.h || query.height),
      config.transform.maxHeight
    );
  }

  // Quality (1-100)
  if (query.q || query.quality) {
    params.quality = Math.max(1, Math.min(100, parseInt(query.q || query.quality)));
  }

  // Format conversion
  if (query.f || query.format) {
    const format = (query.f || query.format).toLowerCase();
    if (config.transform.supportedFormats.includes(format)) {
      params.format = format;
    }
  }

  // Fit mode (cover, contain, fill, inside, outside)
  if (query.fit) {
    const validFits = ['cover', 'contain', 'fill', 'inside', 'outside'];
    if (validFits.includes(query.fit)) {
      params.fit = query.fit;
    }
  }

  // Blur (0.3 to 1000)
  if (query.blur) {
    params.blur = Math.max(0.3, Math.min(1000, parseFloat(query.blur)));
  }

  // Grayscale
  if (query.grayscale === 'true' || query.grayscale === '1') {
    params.grayscale = true;
  }

  return params;
}

/**
 * Build a CDN URL for a media file
 */
function buildMediaUrl(req, filename, category) {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/media/${category}/${filename}`;
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

module.exports = {
  getMediaCategory,
  isAllowedMimeType,
  generateUniqueFilename,
  parseTransformParams,
  buildMediaUrl,
  formatFileSize,
};
