# Railway Deployment Setup

## Overview
This application requires persistent file storage for PDF uploads. Railway's default filesystem is ephemeral, so we need to use Railway Volumes for persistence.

## Railway Volume Setup

### 1. Create a Volume in Railway Dashboard

1. Open your Railway project dashboard
2. Click the Command Palette (⌘K) or right-click on the project canvas
3. Select "Create Volume"
4. Connect the volume to your Node.js service
5. Set the mount path to: `/app/uploads`

### 2. Environment Variables

Railway automatically provides these environment variables when a volume is attached:
- `RAILWAY_VOLUME_NAME`: Name of the volume
- `RAILWAY_VOLUME_MOUNT_PATH`: Mount path of the volume (`/app/uploads`)
- `RAILWAY_ENVIRONMENT_NAME`: Railway environment identifier

### 3. Deployment Process

1. Commit all changes including the `railway.toml` configuration
2. Push to your Railway-connected git repository
3. Railway will automatically:
   - Build the application using Nixpacks
   - Mount the volume at `/app/uploads`
   - Start the server with `npm start`

## File Storage Behavior

### Local Development
- Files are stored in `./uploads/quotations/`
- Uses relative paths from the server directory

### Railway Production
- Files are stored in `/app/uploads/quotations/` (on the mounted volume)
- Volume persists across deployments and container restarts
- Uses absolute paths within the container

## Troubleshooting

### Check Volume Mount
The server logs will show:
```
Environment detected: Railway
Railway Volume Mount Path: /app/uploads
Railway Volume Name: uploads
```

### Verify File Persistence
1. Upload a PDF through the application
2. Check the server logs for "Using uploads directory: /app/uploads/quotations"
3. Restart the Railway service
4. The PDF should still be accessible after restart

## Important Notes

- Volume size limits depend on your Railway plan (0.5GB Free, 5GB Hobby, 50GB Pro)
- Volumes cannot be downsized, only grown
- Each service can only have one volume
- Volume operations require service restarts

## Migration from Local-Only Storage

Existing quotations with Cloudinary URLs will continue to work through the legacy support in the PDF proxy endpoint. New uploads will use the Railway volume storage.
