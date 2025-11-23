const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import routes
const uploadRoutes = require('./routes/upload');
const mediaRoutes = require('./routes/media');
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();

// Enable CORS
app.use(cors(config.cors));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    name: 'Media CDN',
    version: '1.0.0',
    description: 'A media CDN server for serving and transforming images, videos, and other media files',
    endpoints: {
      upload: {
        single: {
          method: 'POST',
          url: `${baseUrl}/upload`,
          description: 'Upload a single file',
          body: 'multipart/form-data with "file" field',
        },
        multiple: {
          method: 'POST',
          url: `${baseUrl}/upload/multiple`,
          description: 'Upload multiple files (up to 10)',
          body: 'multipart/form-data with "files" field',
        },
      },
      media: {
        serve: {
          method: 'GET',
          url: `${baseUrl}/media/:category/:filename`,
          description: 'Serve a media file',
          categories: ['images', 'videos', 'documents'],
          transformParams: {
            'w, width': 'Resize width (max 4000)',
            'h, height': 'Resize height (max 4000)',
            'q, quality': 'Output quality 1-100',
            'f, format': 'Output format (jpeg, png, webp, avif)',
            fit: 'Resize fit (cover, contain, fill)',
            blur: 'Apply blur (0.3-1000)',
            grayscale: 'Convert to grayscale',
          },
        },
      },
      api: {
        listFiles: {
          method: 'GET',
          url: `${baseUrl}/api/files`,
          description: 'List all files',
          queryParams: { category: 'Filter by category' },
        },
        getFile: {
          method: 'GET',
          url: `${baseUrl}/api/files/:category/:filename`,
          description: 'Get file info',
        },
        deleteFile: {
          method: 'DELETE',
          url: `${baseUrl}/api/files/:category/:filename`,
          description: 'Delete a file (requires API key)',
        },
        stats: {
          method: 'GET',
          url: `${baseUrl}/api/stats`,
          description: 'Get storage statistics',
        },
      },
      health: {
        method: 'GET',
        url: `${baseUrl}/health`,
        description: 'Health check endpoint',
      },
    },
    examples: {
      upload: `curl -X POST -F "file=@image.jpg" ${baseUrl}/upload`,
      serve: `${baseUrl}/media/images/abc123.jpg`,
      resize: `${baseUrl}/media/images/abc123.jpg?w=300&h=200`,
      format: `${baseUrl}/media/images/abc123.jpg?f=webp&q=85`,
      transform: `${baseUrl}/media/images/abc123.jpg?w=400&f=webp&q=80&blur=2`,
    },
  });
});

// Mount routes
app.use('/upload', uploadRoutes);
app.use('/media', mediaRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
});

// Start server
app.listen(config.port, config.host, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                     MEDIA CDN SERVER                       ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://${config.host}:${config.port}                   ║
║                                                           ║
║  Endpoints:                                               ║
║    POST /upload          - Upload single file             ║
║    POST /upload/multiple - Upload multiple files          ║
║    GET  /media/:cat/:id  - Serve media file               ║
║    GET  /api/files       - List all files                 ║
║    GET  /api/stats       - Storage statistics             ║
║                                                           ║
║  Visit http://localhost:${config.port}/ for full API docs          ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
