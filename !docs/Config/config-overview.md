# Configuration Overview

This document explains the configuration differences between local development and production environments for the MFLanding project.

## Environment Configuration

### Local Development

**Frontend (.env)**
```env
# Frontend runs on localhost:8080 in development
# Backend runs on localhost:3001 in development
VITE_API_URL=http://localhost:3001
NODE_ENV=development
```

**Backend**
- Runs on `localhost:3001`
- CORS configured to allow `http://localhost:8080` (frontend)
- Uses local file system for documentation serving
- Debug logging enabled
- Rate limiting configured for development

### Production

**Frontend (.env)**
```env
VITE_API_URL=https://mixfade-backend-production.up.railway.app
NODE_ENV=production
```

**Backend**
- Deployed on Railway at `https://mixfade-backend-production.up.railway.app`
- CORS configured for production domains:
  - `mixfade.com`
  - `mixfade-frontend-production.up.railway.app`
- Production-grade security headers
- Enhanced rate limiting
- Error monitoring and logging

## API Endpoints

The following API endpoints are available in both environments:

### Documentation Service
- `GET /api/docs/content?path={path}` - Fetch document content
- `GET /api/docs/structure` - Get documentation structure
- `GET /api/docs/search?q={query}` - Search documents

### Other Services
- `GET /api/email` - Email service
- `GET /api/download` - Download service
- `GET /health` - Health check
- `GET /api/health` - API health check
- `GET /security-stats` - Security statistics

## Key Differences

| Aspect | Local Development | Production |
|--------|------------------|------------|
| Frontend URL | `http://localhost:8080` | `https://mixfade.com` |
| Backend URL | `http://localhost:3001` | `https://mixfade-backend-production.up.railway.app` |
| HTTPS | No | Yes |
| CORS Origins | Localhost ports | Production domains |
| Rate Limiting | Relaxed | Strict |
| Logging | Debug level | Production level |
| Security Headers | Basic | Enhanced |
| Documentation Source | Local `/!docs` directory | Deployed documentation |

## Setup Instructions

### Local Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev  # Starts on localhost:3001
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env  # Configure VITE_API_URL=http://localhost:3001
   npm run dev  # Starts on localhost:8080
   ```

### Production Deployment

1. **Backend Deployment (Railway)**
   - Environment variables configured in Railway dashboard
   - Automatic deployment from main branch
   - Health checks enabled

2. **Frontend Deployment**
   - Build with production API URL
   - Deploy to hosting platform
   - Configure custom domain if needed

## Environment Variables

### Frontend Variables
- `VITE_API_URL` - Backend API base URL
- `NODE_ENV` - Environment mode (development/production)

### Backend Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

## Security Considerations

### Development
- CORS allows localhost origins
- Relaxed rate limiting for testing
- Debug information exposed

### Production
- Strict CORS policy
- Enhanced rate limiting
- Security headers (helmet)
- No debug information exposure
- HTTPS enforcement

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is in backend's allowed origins
   - Check VITE_API_URL matches backend URL

2. **API Connection Issues**
   - Verify backend is running on correct port
   - Check network connectivity
   - Validate environment variables

3. **Documentation Not Loading**
   - Ensure `/!docs` directory exists and is accessible
   - Check file permissions
   - Verify API endpoints are responding

### Debug Commands

```bash
# Test backend health
curl http://localhost:3001/health

# Test documentation API
curl http://localhost:3001/api/docs/structure

# Check CORS configuration
curl -H "Origin: http://localhost:8080" http://localhost:3001/api/docs/structure
```

## Migration Notes

The documentation system was recently migrated from a static frontend-driven approach to a backend service:

- **Before**: Documentation served as static files from `frontend/public/docs`
- **After**: Documentation served via backend API from `/!docs` directory
- **Benefits**: Real-time updates, improved search, better consistency, API-first access

This change requires updating the `VITE_API_URL` configuration and ensuring the backend documentation service is properly deployed.