const sharp = require('sharp');
const config = require('../config');

/**
 * Image transformation service using Sharp
 */
class TransformService {
  /**
   * Transform an image buffer based on provided parameters
   */
  async transform(buffer, params, originalFormat) {
    let pipeline = sharp(buffer);

    // Get image metadata
    const metadata = await pipeline.metadata();

    // Resize if width or height specified
    if (params.width || params.height) {
      pipeline = pipeline.resize({
        width: params.width,
        height: params.height,
        fit: params.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Apply blur
    if (params.blur) {
      pipeline = pipeline.blur(params.blur);
    }

    // Apply grayscale
    if (params.grayscale) {
      pipeline = pipeline.grayscale();
    }

    // Determine output format
    const outputFormat = params.format || this.getOutputFormat(originalFormat, metadata.format);
    const quality = params.quality || config.transform.defaultQuality;

    // Apply format-specific options
    switch (outputFormat) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'gif':
        pipeline = pipeline.gif();
        break;
      default:
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    const transformedBuffer = await pipeline.toBuffer();

    return {
      buffer: transformedBuffer,
      format: outputFormat,
      mimeType: this.getMimeType(outputFormat),
    };
  }

  /**
   * Get the output format based on original format
   */
  getOutputFormat(originalExt, detectedFormat) {
    // Normalize extension
    const ext = (originalExt || '').replace('.', '').toLowerCase();

    // Map common extensions
    const formatMap = {
      jpg: 'jpeg',
      jpeg: 'jpeg',
      png: 'png',
      webp: 'webp',
      avif: 'avif',
      gif: 'gif',
    };

    return formatMap[ext] || formatMap[detectedFormat] || 'jpeg';
  }

  /**
   * Get MIME type for a format
   */
  getMimeType(format) {
    const mimeTypes = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
    };

    return mimeTypes[format] || 'image/jpeg';
  }

  /**
   * Check if a MIME type is transformable
   */
  isTransformable(mimeType) {
    const transformableMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
    ];

    return transformableMimeTypes.includes(mimeType);
  }

  /**
   * Generate a cache key for transformed images
   */
  getCacheKey(filename, params) {
    const parts = [filename];

    if (params.width) parts.push(`w${params.width}`);
    if (params.height) parts.push(`h${params.height}`);
    if (params.quality) parts.push(`q${params.quality}`);
    if (params.format) parts.push(`f${params.format}`);
    if (params.fit) parts.push(`fit${params.fit}`);
    if (params.blur) parts.push(`blur${params.blur}`);
    if (params.grayscale) parts.push('gray');

    return parts.join('_');
  }
}

module.exports = new TransformService();
