# Quick Deployment Setup - 3 Steps

## Step 1: Update Backend URL (1 minute)

Edit `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-BACKEND-URL.com/api'  // ← Put your backend URL here
};
```

**Examples:**
- `https://my-healthcare-api.herokuapp.com/api`
- `https://api.healthcare.com/api`
- `http://123.45.67.89:3000/api`

## Step 2: Update CORS in Backend (1 minute)

Edit `backend/server.js`, find the CORS section and add your frontend URL:

```javascript
app.use(cors({
  origin: [
    'http://localhost:4200',  // Keep for local development
    'https://YOUR-FRONTEND-URL.com'  // ← Add your frontend URL here
  ],
  credentials: true
}));
```

## Step 3: Build and Deploy (5 minutes)

### Build Frontend:
```bash
cd frontend
npm install
ng build --configuration production
```

Output will be in `frontend/dist/healthcare-platform/`

### Deploy Frontend:
Upload the `dist` folder to your hosting (Vercel, Netlify, etc.)

### Deploy Backend:
```bash
cd backend
npm install
npm start
```

## ✅ Done!

Test by visiting your frontend URL and trying to login/signup.

---

## Need Your Deployment URLs?

**Tell me:**
1. Where is your backend deployed? (URL or IP)
2. Where will your frontend be deployed? (URL)

**I'll update the files for you!**

Just reply with:
- Backend URL: `https://...`
- Frontend URL: `https://...`
