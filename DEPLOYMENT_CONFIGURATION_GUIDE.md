# Deployment Configuration Guide

## 🚀 How to Add Your Deployment URL to Frontend

### Current Setup

Your Angular app has two environment files:
- `frontend/src/environments/environment.ts` - Development (localhost)
- `frontend/src/environments/environment.prod.ts` - Production (deployment)

### Step-by-Step Configuration

#### Option 1: Update Production Environment File (Recommended)

1. **Edit `frontend/src/environments/environment.prod.ts`:**

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.com/api'  // ← Change this
};
```

Replace `https://your-backend-url.com` with your actual backend deployment URL.

**Examples:**
- Heroku: `https://your-app-name.herokuapp.com/api`
- AWS: `https://api.yourdomain.com/api`
- DigitalOcean: `https://your-droplet-ip/api`
- Vercel/Netlify: `https://your-backend.vercel.app/api`

2. **Build for production:**

```bash
cd frontend
ng build --configuration production
```

This creates optimized files in `frontend/dist/` that use the production URL.

---

#### Option 2: Create Custom Environment for Your Deployment

If you want separate configs for staging/production:

1. **Create `frontend/src/environments/environment.staging.ts`:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://staging-backend.yourdomain.com/api'
};
```

2. **Update `angular.json` to add staging configuration:**

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod.ts"
      }
    ],
    ...
  },
  "staging": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.staging.ts"
      }
    ]
  }
}
```

3. **Build for staging:**

```bash
ng build --configuration staging
```

---

### 🌐 Complete Deployment Scenarios

#### Scenario 1: Same Domain (Frontend & Backend)

**Setup:**
- Frontend: `https://yourdomain.com`
- Backend: `https://yourdomain.com/api`

**Configuration:**
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/api'  // Relative URL works!
};
```

**Backend CORS:**
```javascript
// backend/server.js
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

---

#### Scenario 2: Different Domains

**Setup:**
- Frontend: `https://app.yourdomain.com`
- Backend: `https://api.yourdomain.com`

**Configuration:**
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api'
};
```

**Backend CORS:**
```javascript
// backend/server.js
app.use(cors({
  origin: 'https://app.yourdomain.com',
  credentials: true
}));
```

---

#### Scenario 3: Different Subdomains

**Setup:**
- Frontend: `https://healthcare.yourdomain.com`
- Backend: `https://api-healthcare.yourdomain.com`

**Configuration:**
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api-healthcare.yourdomain.com/api'
};
```

---

### 📦 Deployment Platforms

#### Vercel (Frontend)

1. **Deploy frontend:**
```bash
cd frontend
npm install -g vercel
vercel
```

2. **Set environment variable in Vercel dashboard:**
- Go to Project Settings → Environment Variables
- Add: `API_URL` = `https://your-backend-url.com/api`

3. **Update environment.prod.ts to use env variable:**
```typescript
export const environment = {
  production: true,
  apiUrl: process.env['API_URL'] || '/api'
};
```

#### Netlify (Frontend)

1. **Create `netlify.toml`:**
```toml
[build]
  command = "cd frontend && npm install && ng build --configuration production"
  publish = "frontend/dist/healthcare-platform"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy:**
```bash
netlify deploy --prod
```

#### Heroku (Backend)

1. **Create `Procfile` in backend:**
```
web: node server.js
```

2. **Deploy:**
```bash
cd backend
heroku create your-app-name
git push heroku main
```

3. **Set environment variables:**
```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
```

#### AWS EC2 / DigitalOcean

1. **SSH into server:**
```bash
ssh user@your-server-ip
```

2. **Clone and setup:**
```bash
git clone your-repo
cd your-repo/backend
npm install
pm2 start server.js
```

3. **Setup Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

### 🔒 Security Checklist

Before deploying:

- [ ] Update CORS origins in backend
- [ ] Set proper environment variables
- [ ] Use HTTPS (SSL certificate)
- [ ] Secure MongoDB connection
- [ ] Set strong JWT_SECRET
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring/logging

---

### 🧪 Testing Deployment

1. **Test API connection:**
```bash
curl https://your-backend-url.com/api/auth/verify
```

2. **Test frontend:**
- Open browser dev tools
- Go to Network tab
- Check API calls are going to correct URL

3. **Test CORS:**
```bash
curl -H "Origin: https://your-frontend-url.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend-url.com/api/auth/login
```

---

### 🐛 Common Issues

#### Issue: API calls failing with CORS error

**Solution:**
```javascript
// backend/server.js
app.use(cors({
  origin: [
    'http://localhost:4200',  // Development
    'https://your-frontend-url.com'  // Production
  ],
  credentials: true
}));
```

#### Issue: 404 on page refresh

**Solution:** Configure server to serve index.html for all routes

**Nginx:**
```nginx
try_files $uri $uri/ /index.html;
```

**Express (if serving frontend from backend):**
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
```

#### Issue: Environment variables not working

**Solution:** Make sure to rebuild after changing environment files:
```bash
ng build --configuration production
```

---

### 📝 Quick Reference

**Development:**
```bash
# Frontend
cd frontend
ng serve
# Uses: http://localhost:3000/api

# Backend
cd backend
npm start
# Runs on: http://localhost:3000
```

**Production Build:**
```bash
# Frontend
cd frontend
ng build --configuration production
# Output: frontend/dist/

# Backend
cd backend
npm start
# Set NODE_ENV=production
```

**Environment Variables:**
```bash
# Backend (.env file)
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret
PORT=3000
NODE_ENV=production

# Frontend (environment.prod.ts)
apiUrl: 'https://your-backend-url.com/api'
```

---

### 🎯 Recommended Setup

**For Small/MVP:**
- Frontend: Vercel/Netlify (Free tier)
- Backend: Heroku (Free tier) or Railway
- Database: MongoDB Atlas (Free tier)

**For Production:**
- Frontend: Vercel/Netlify (Paid)
- Backend: AWS EC2 / DigitalOcean
- Database: MongoDB Atlas (Paid)
- CDN: Cloudflare

**Cost Estimate:**
- MVP: $0-20/month
- Production: $50-200/month

---

## 🚀 Ready to Deploy?

1. Update `frontend/src/environments/environment.prod.ts` with your backend URL
2. Build frontend: `ng build --configuration production`
3. Deploy frontend to Vercel/Netlify
4. Deploy backend to Heroku/AWS
5. Update CORS in backend with frontend URL
6. Test everything!

Need help with specific deployment platform? Let me know!
