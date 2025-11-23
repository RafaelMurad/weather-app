# Media CDN

A lightweight, self-hosted media CDN server for serving and transforming images, videos, and documents. Perfect for powering your CMS, static websites, or any application that needs media hosting.

## Features

- **File Upload**: Single and batch file uploads via REST API
- **Media Serving**: Efficient file serving with proper caching headers
- **Image Transformation**: On-the-fly resize, format conversion, blur, grayscale
- **Video Streaming**: Range request support for video playback
- **Cache Control**: CDN-friendly cache headers for optimal performance
- **CORS Support**: Configurable cross-origin resource sharing
- **API Key Auth**: Optional API key protection for uploads/deletes

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or with auto-reload for development
npm run dev
```

The server will start at `http://localhost:3000`

## API Endpoints

### Upload

**Single File Upload**
```bash
curl -X POST -F "file=@image.jpg" http://localhost:3000/upload
```

**Multiple Files Upload**
```bash
curl -X POST -F "files=@image1.jpg" -F "files=@image2.jpg" http://localhost:3000/upload/multiple
```

### Serve Media

**Basic serving:**
```
GET /media/images/abc123.jpg
GET /media/videos/xyz789.mp4
GET /media/documents/doc456.pdf
```

**Image Transformations:**
```
# Resize to 300px width
GET /media/images/abc123.jpg?w=300

# Resize to specific dimensions
GET /media/images/abc123.jpg?w=300&h=200

# Convert to WebP format
GET /media/images/abc123.jpg?f=webp

# Adjust quality
GET /media/images/abc123.jpg?q=85

# Apply blur
GET /media/images/abc123.jpg?blur=5

# Grayscale
GET /media/images/abc123.jpg?grayscale=true

# Combine transformations
GET /media/images/abc123.jpg?w=400&f=webp&q=80&blur=2
```

**Transformation Parameters:**

| Parameter | Alias | Description | Range |
|-----------|-------|-------------|-------|
| `width` | `w` | Resize width | 1-4000 |
| `height` | `h` | Resize height | 1-4000 |
| `quality` | `q` | Output quality | 1-100 |
| `format` | `f` | Output format | jpeg, png, webp, avif |
| `fit` | - | Resize fit mode | cover, contain, fill, inside, outside |
| `blur` | - | Blur amount | 0.3-1000 |
| `grayscale` | - | Convert to grayscale | true/1 |

### API

**List all files:**
```bash
curl http://localhost:3000/api/files
curl http://localhost:3000/api/files?category=images
```

**Get file info:**
```bash
curl http://localhost:3000/api/files/images/abc123.jpg
```

**Delete file:**
```bash
curl -X DELETE http://localhost:3000/api/files/images/abc123.jpg
```

**Storage statistics:**
```bash
curl http://localhost:3000/api/stats
```

## Configuration

Configure via environment variables:

```bash
# Server
PORT=3000
HOST=0.0.0.0

# Storage
UPLOADS_DIR=./uploads
MAX_FILE_SIZE=104857600  # 100MB in bytes

# Cache (seconds)
CACHE_MAX_AGE=31536000   # 1 year
CACHE_S_MAX_AGE=31536000 # 1 year for CDN

# CORS
CORS_ORIGIN=*  # Or specific origin like https://myapp.com

# Security (optional)
API_KEY=your-secret-api-key
```

### Example `.env` file:

```env
PORT=3000
CORS_ORIGIN=https://my-cms-app.com,https://my-agency-site.com
API_KEY=super-secret-key-123
MAX_FILE_SIZE=52428800
```

## Usage with Your Apps

### In your CMS Builder App

```javascript
// Upload an image
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://your-cdn.com/upload', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
    },
    body: formData,
  });

  const data = await response.json();
  return data.file.url;
}

// Use transformed image
const thumbnailUrl = `${imageUrl}?w=200&h=200&f=webp`;
const fullSizeUrl = `${imageUrl}?w=1200&q=90`;
```

### In your React Agency Site

```jsx
function OptimizedImage({ src, alt, width }) {
  // Auto-serve WebP with fallback
  const webpUrl = `${src}?w=${width}&f=webp&q=85`;
  const jpegUrl = `${src}?w=${width}&q=85`;

  return (
    <picture>
      <source srcSet={webpUrl} type="image/webp" />
      <img src={jpegUrl} alt={alt} width={width} loading="lazy" />
    </picture>
  );
}
```

## Supported File Types

**Images:** JPEG, PNG, GIF, WebP, AVIF, SVG

**Videos:** MP4, WebM, OGG, QuickTime

**Documents:** PDF

## Production Deployment

For production, consider:

1. **Reverse Proxy**: Put behind Nginx/Caddy for SSL
2. **Cloud Storage**: Replace local storage with S3/GCS
3. **CDN Layer**: Put Cloudflare/CloudFront in front
4. **API Key**: Always set `API_KEY` in production

### Example Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name cdn.yoursite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

## License

MIT
