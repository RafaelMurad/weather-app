const express = require('express');
const storage = require('../services/storage');
const { requireApiKey } = require('../middleware/auth');
const { noCache } = require('../middleware/cache');
const { formatFileSize, buildMediaUrl } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/files
 * List all files, optionally filtered by category
 */
router.get('/files', noCache, async (req, res) => {
  try {
    const { category } = req.query;
    const validCategories = ['images', 'videos', 'documents'];

    let files = [];

    if (category && validCategories.includes(category)) {
      // List files in specific category
      const categoryFiles = await storage.listFiles(category);
      files = categoryFiles.map((file) => ({
        ...file,
        category,
        sizeFormatted: formatFileSize(file.size),
        url: buildMediaUrl(req, file.filename, category),
      }));
    } else {
      // List all files
      for (const cat of validCategories) {
        const categoryFiles = await storage.listFiles(cat);
        files.push(
          ...categoryFiles.map((file) => ({
            ...file,
            category: cat,
            sizeFormatted: formatFileSize(file.size),
            url: buildMediaUrl(req, file.filename, cat),
          }))
        );
      }
    }

    // Sort by creation date (newest first)
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      count: files.length,
      files,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/files/:category/:filename
 * Get info about a specific file
 */
router.get('/files/:category/:filename', noCache, async (req, res) => {
  try {
    const { category, filename } = req.params;

    const exists = await storage.exists(category, filename);
    if (!exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found',
      });
    }

    const stats = await storage.getStats(category, filename);

    res.json({
      filename,
      category,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      url: buildMediaUrl(req, filename, category),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/files/:category/:filename
 * Delete a file
 */
router.delete('/files/:category/:filename', requireApiKey, noCache, async (req, res) => {
  try {
    const { category, filename } = req.params;

    const exists = await storage.exists(category, filename);
    if (!exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found',
      });
    }

    await storage.deleteFile(category, filename);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/stats
 * Get storage statistics
 */
router.get('/stats', noCache, async (req, res) => {
  try {
    const usage = await storage.getStorageUsage();

    res.json({
      storage: {
        images: {
          count: usage.images.count,
          size: usage.images.size,
          sizeFormatted: formatFileSize(usage.images.size),
        },
        videos: {
          count: usage.videos.count,
          size: usage.videos.size,
          sizeFormatted: formatFileSize(usage.videos.size),
        },
        documents: {
          count: usage.documents.count,
          size: usage.documents.size,
          sizeFormatted: formatFileSize(usage.documents.size),
        },
        total: {
          count: usage.images.count + usage.videos.count + usage.documents.count,
          size: usage.total,
          sizeFormatted: formatFileSize(usage.total),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
