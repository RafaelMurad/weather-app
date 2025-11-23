const path = require('path');

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Storage configuration
  uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default

  // Allowed file types
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
    videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    documents: ['application/pdf'],
  },

  // Cache configuration (in seconds)
  cache: {
    maxAge: parseInt(process.env.CACHE_MAX_AGE) || 31536000, // 1 year
    sMaxAge: parseInt(process.env.CACHE_S_MAX_AGE) || 31536000, // 1 year for CDN
  },

  // Image transformation defaults
  transform: {
    defaultQuality: 80,
    maxWidth: 4000,
    maxHeight: 4000,
    supportedFormats: ['jpeg', 'png', 'webp', 'avif', 'gif'],
  },

  // CORS configuration
  cors: {
    // Allow all origins by default, restrict in production
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  },

  // API Key for protected routes (optional)
  apiKey: process.env.API_KEY || null,
};
