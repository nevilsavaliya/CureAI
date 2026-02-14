# Environment Configuration Guide

## Development

For local development, edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

Then run:
```bash
npm start
```

## Production Deployment

### Method 1: Using Environment Variables (Recommended)

Set these environment variables before building:

```bash
export API_URL="https://your-backend-api.com/api"
export SOCKET_URL="https://your-backend-api.com"
npm run build:prod
```

The `build:prod` script will automatically:
1. Run `scripts/set-env.js` to inject environment variables
2. Build the production bundle with the correct URLs

### Method 2: Manual Configuration

Edit `src/environments/environment.prod.ts` directly:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-api.com/api',
  socketUrl: 'https://your-backend-api.com'
};
```

Then build:
```bash
npm run build
```

## Platform-Specific Instructions

### Vercel
Add environment variables in Vercel dashboard:
- `API_URL` = `https://your-backend-api.com/api`
- `SOCKET_URL` = `https://your-backend-api.com`

Build command: `npm run build:prod`

### Netlify
Add environment variables in Netlify dashboard:
- `API_URL` = `https://your-backend-api.com/api`
- `SOCKET_URL` = `https://your-backend-api.com`

Build command: `npm run build:prod`

### Docker
Set environment variables in docker-compose.yml or Dockerfile:

```yaml
environment:
  - API_URL=https://your-backend-api.com/api
  - SOCKET_URL=https://your-backend-api.com
```

### Firebase Hosting
Set environment variables before deployment:

```bash
export API_URL="https://your-backend-api.com/api"
export SOCKET_URL="https://your-backend-api.com"
npm run build:prod
firebase deploy
```

## Testing Environment Configuration

After building, check the generated `dist/` folder:

```bash
cat dist/healthcare-platform-frontend/main.*.js | grep -o "apiUrl.*socketUrl" | head -1
```

You should see your configured URLs in the output.

## Troubleshooting

### URLs not updating
- Make sure you're running `npm run build:prod` (not just `npm run build`)
- Check that environment variables are set in your deployment platform
- Clear build cache: `rm -rf dist/ .angular/`

### CORS errors
- Ensure your backend API allows requests from your frontend domain
- Check that API_URL includes the full URL with protocol (https://)

### WebSocket connection fails
- Verify SOCKET_URL is set correctly (without /api suffix)
- Check that your backend supports WebSocket connections
- Ensure firewall/proxy allows WebSocket traffic
