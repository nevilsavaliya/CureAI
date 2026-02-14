# Frontend Configuration Guide

## Environment Configuration

The frontend uses `src/config/environment.ts` for configuration instead of .env files.

### Local Development

Edit `frontend/src/config/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',  // Your local backend URL
  socketUrl: 'http://localhost:3000',
  appName: 'Healthcare Platform',
  appVersion: '1.0.0',
  enableAnalytics: false,
  enableDebug: true
};
```

### Production Deployment

Edit `frontend/src/config/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-api.com/api',  // Your production backend URL
  socketUrl: 'https://your-backend-api.com',
  appName: 'Healthcare Platform',
  appVersion: '1.0.0',
  enableAnalytics: true,
  enableDebug: false
};
```

### How It Works

- During development: Uses `environment.ts`
- During production build: Angular automatically replaces `environment.ts` with `environment.prod.ts`
- The file `environment.ts` is gitignored, so you can safely edit it locally
- The file `environment.prod.ts` should contain your production URLs

### Important Notes

1. **Don't commit sensitive data**: Add `environment.ts` to `.gitignore`
2. **Update production file**: Before deploying, update `environment.prod.ts` with your production URLs
3. **No .env files needed**: Angular uses file replacement instead of .env files
