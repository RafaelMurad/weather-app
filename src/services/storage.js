const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Storage service for managing media files on disk
 */
class StorageService {
  constructor() {
    this.uploadsDir = config.uploadsDir;
    this.ensureDirectories();
  }

  /**
   * Ensure all upload directories exist
   */
  ensureDirectories() {
    const dirs = ['images', 'videos', 'documents'];
    dirs.forEach((dir) => {
      const dirPath = path.join(this.uploadsDir, dir);
      if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  /**
   * Get the full path for a file
   */
  getFilePath(category, filename) {
    return path.join(this.uploadsDir, category, filename);
  }

  /**
   * Check if a file exists
   */
  async exists(category, filename) {
    try {
      await fs.access(this.getFilePath(category, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getStats(category, filename) {
    const filePath = this.getFilePath(category, filename);
    return fs.stat(filePath);
  }

  /**
   * Read a file
   */
  async readFile(category, filename) {
    const filePath = this.getFilePath(category, filename);
    return fs.readFile(filePath);
  }

  /**
   * Create a read stream for a file
   */
  createReadStream(category, filename) {
    const filePath = this.getFilePath(category, filename);
    return fsSync.createReadStream(filePath);
  }

  /**
   * Delete a file
   */
  async deleteFile(category, filename) {
    const filePath = this.getFilePath(category, filename);
    await fs.unlink(filePath);
  }

  /**
   * List all files in a category
   */
  async listFiles(category) {
    const dirPath = path.join(this.uploadsDir, category);
    try {
      const files = await fs.readdir(dirPath);
      const fileDetails = await Promise.all(
        files.map(async (filename) => {
          const stats = await this.getStats(category, filename);
          return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          };
        })
      );
      return fileDetails;
    } catch {
      return [];
    }
  }

  /**
   * Get total storage usage
   */
  async getStorageUsage() {
    const categories = ['images', 'videos', 'documents'];
    const usage = {};
    let total = 0;

    for (const category of categories) {
      const files = await this.listFiles(category);
      const categorySize = files.reduce((sum, file) => sum + file.size, 0);
      usage[category] = {
        count: files.length,
        size: categorySize,
      };
      total += categorySize;
    }

    usage.total = total;
    return usage;
  }
}

module.exports = new StorageService();
