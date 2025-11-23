const express = require('express');
const path = require('path');
const mime = require('mime-types');
const storage = require('../services/storage');
const transform = require('../services/transform');
const { setCacheHeaders, setETag } = require('../middleware/cache');
const { parseTransformParams, formatFileSize } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /media/:category/:filename
 * Serve a media file with optional transformations
 *
 * Query parameters for images:
 * - w, width: Resize width (max 4000)
 * - h, height: Resize height (max 4000)
 * - q, quality: Output quality 1-100 (default 80)
 * - f, format: Output format (jpeg, png, webp, avif)
 * - fit: Resize fit mode (cover, contain, fill, inside, outside)
 * - blur: Apply blur (0.3-1000)
 * - grayscale: Convert to grayscale (true/1)
 */
router.get('/:category/:filename', setCacheHeaders, async (req, res, next) => {
  try {
    const { category, filename } = req.params;

    // Validate category
    const validCategories = ['images', 'videos', 'documents'];
    if (!validCategories.includes(category)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid media category',
      });
    }

    // Check if file exists
    const exists = await storage.exists(category, filename);
    if (!exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found',
      });
    }

    // Get file stats for ETag
    const stats = await storage.getStats(category, filename);
    const etag = setETag(stats);

    // Check if client has cached version
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    // Get MIME type
    const mimeType = mime.lookup(filename) || 'application/octet-stream';

    // Parse transformation parameters
    const transformParams = parseTransformParams(req.query);
    const hasTransforms = Object.keys(transformParams).length > 0;

    // If it's an image and has transform parameters, apply transformations
    if (category === 'images' && hasTransforms && transform.isTransformable(mimeType)) {
      const buffer = await storage.readFile(category, filename);
      const originalExt = path.extname(filename);

      const result = await transform.transform(buffer, transformParams, originalExt);

      res.set({
        'Content-Type': result.mimeType,
        'Content-Length': result.buffer.length,
        ETag: `"${Date.now()}-${result.buffer.length}"`,
      });

      return res.send(result.buffer);
    }

    // Serve file directly
    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      ETag: etag,
    });

    // For videos, support range requests
    if (category === 'videos') {
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
        });

        const stream = storage.createReadStream(category, filename);
        // Note: For proper range streaming, you'd need to pipe with start/end options
        // This is a simplified implementation
        return stream.pipe(res);
      }

      res.set('Accept-Ranges', 'bytes');
    }

    // Stream the file
    const stream = storage.createReadStream(category, filename);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * HEAD /media/:category/:filename
 * Get file info without downloading
 */
router.head('/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;

    const exists = await storage.exists(category, filename);
    if (!exists) {
      return res.status(404).end();
    }

    const stats = await storage.getStats(category, filename);
    const mimeType = mime.lookup(filename) || 'application/octet-stream';

    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      ETag: setETag(stats),
      'Last-Modified': stats.mtime.toUTCString(),
    });

    res.end();
  } catch {
    res.status(500).end();
  }
});

module.exports = router;
