# 🚀 Render Backend Deployment - Environment Variables

## Complete list of environment variables for Render deployment

---

## ✅ **REQUIRED - Must Set These**

### 1. **NODE_ENV**
```
production
```
**Purpose:** Sets the application to production mode  
**Critical:** Enables production optimizations and security features

### 2. **MONGODB_URI**
```
mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform?retryWrites=true&w=majority
```
**Purpose:** MongoDB Atlas connection string  
**How to get:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and database name

### 3. **JWT_SECRET**
```
Generate a secure random string (min 32 characters)
Example: 8f3d9a2b7c1e5f4a6d8b9c2e1f3a5b7c9d2e4f6a8b1c3d5e7f9a2b4c6d8e1f3
```
**Purpose:** Signs and verifies JWT tokens for authentication  
**Generate using:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. **ENCRYPTION_MASTER_KEY**
```
Must be exactly 64 hex characters
Example: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```
**Purpose:** Encrypts sensitive patient messages  
**Generate using:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. **FRONTEND_URL**
```
https://your-frontend-app.vercel.app
```
**Purpose:** Your frontend application URL (Vercel/Netlify)  
**Example:** `https://healthcare-platform.vercel.app`

### 6. **CORS_ORIGINS**
```
https://your-frontend-app.vercel.app
```
**Purpose:** Allowed origins for CORS (same as FRONTEND_URL)  
**Multiple origins:** `https://app1.vercel.app,https://app2.netlify.app`

---

## 🔧 **RECOMMENDED - Should Set These**

### 7. **API_BASE_URL**
```
https://your-backend-app.onrender.com
```
**Purpose:** Your Render backend URL (without /api)  
**Example:** `https://healthcare-backend.onrender.com`  
**Note:** Get this AFTER deploying to Render

### 8. **API_URL**
```
https://your-backend-app.onrender.com/api
```
**Purpose:** Full API endpoint URL  
**Example:** `https://healthcare-backend.onrender.com/api`

### 9. **SOCKET_URL**
```
https://your-backend-app.onrender.com
```
**Purpose:** WebSocket connection URL (same as API_BASE_URL)  
**Example:** `https://healthcare-backend.onrender.com`

### 10. **HEALTH_CHECK_URL**
```
https://your-backend-app.onrender.com/api/health
```
**Purpose:** Health check endpoint for monitoring  
**Example:** `https://healthcare-backend.onrender.com/api/health`

### 11. **EMAIL_USER**
```
your-email@gmail.com
```
**Purpose:** Email account for sending notifications  
**Note:** Use Gmail App Password, not regular password

### 12. **EMAIL_PASSWORD**
```
your-16-character-app-password
```
**Purpose:** Gmail App Password  
**How to get:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use the 16-character password

---

## 💳 **PAYMENT GATEWAY (Optional - If Using Payments)**

### 13. **RAZORPAY_KEY_ID**
```
rzp_test_xxxxxxxxxxxxx (test) or rzp_live_xxxxxxxxxxxxx (production)
```
**Purpose:** Razorpay API key  
**Get from:** [Razorpay Dashboard](https://dashboard.razorpay.com/)

### 14. **RAZORPAY_KEY_SECRET**
```
Your Razorpay secret key
```
**Purpose:** Razorpay API secret  
**Get from:** Razorpay Dashboard → Settings → API Keys

### 15. **UPI_ID**
```
9909232769@superyes
```
**Purpose:** Your UPI ID for payments  
**Example:** `yourname@paytm`, `9876543210@ybl`

---

## 🔒 **SSL/SECURITY (Auto-handled by Render - Don't Set)**

### ❌ **SSL_ENABLED**
```
DO NOT SET - Render handles SSL automatically
```

### ❌ **SSL_PORT**
```
DO NOT SET - Not needed on Render
```

---

## 📊 **OPTIONAL - Advanced Configuration**

### 16. **PORT**
```
DO NOT SET - Render sets this automatically
```
**Purpose:** Server port (Render manages this)

### 17. **JWT_EXPIRES_IN**
```
24h (default)
```
**Purpose:** JWT token expiration time  
**Options:** `1h`, `24h`, `7d`, `30d`

### 18. **API_RATE_LIMIT**
```
100 (default)
```
**Purpose:** API requests per 15 minutes per IP  
**Adjust:** Higher for production traffic

### 19. **HSTS_MAX_AGE**
```
31536000 (default - 1 year)
```
**Purpose:** HSTS header max age in seconds

### 20. **HSTS_INCLUDE_SUBDOMAINS**
```
true (default)
```
**Purpose:** Apply HSTS to subdomains

### 21. **HSTS_PRELOAD**
```
true (default)
```
**Purpose:** Enable HSTS preload

---

## 📋 **COMPLETE RENDER ENVIRONMENT VARIABLES**

Copy and paste this into Render dashboard (replace values):

```bash
# === REQUIRED ===
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform?retryWrites=true&w=majority
JWT_SECRET=YOUR_GENERATED_64_CHAR_HEX_STRING
ENCRYPTION_MASTER_KEY=YOUR_GENERATED_64_CHAR_HEX_STRING
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app

# === RECOMMENDED (Set after getting Render URL) ===
API_BASE_URL=https://your-backend.onrender.com
API_URL=https://your-backend.onrender.com/api
SOCKET_URL=https://your-backend.onrender.com
HEALTH_CHECK_URL=https://your-backend.onrender.com/api/health

# === EMAIL (Optional) ===
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# === PAYMENT (Optional) ===
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
UPI_ID=9909232769@superyes

# === ADVANCED (Optional) ===
JWT_EXPIRES_IN=24h
API_RATE_LIMIT=100
```

---

## 🎯 **Step-by-Step Setup Process**

### **Phase 1: Initial Deployment (Set These First)**
1. `NODE_ENV=production`
2. `MONGODB_URI=your_mongodb_atlas_uri`
3. `JWT_SECRET=generated_secret`
4. `ENCRYPTION_MASTER_KEY=generated_key`
5. `FRONTEND_URL=http://localhost:4200` (temporary)
6. `CORS_ORIGINS=http://localhost:4200` (temporary)

### **Phase 2: After First Deployment**
1. Get your Render URL (e.g., `https://healthcare-backend.onrender.com`)
2. Add:
   - `API_BASE_URL=https://healthcare-backend.onrender.com`
   - `API_URL=https://healthcare-backend.onrender.com/api`
   - `SOCKET_URL=https://healthcare-backend.onrender.com`
   - `HEALTH_CHECK_URL=https://healthcare-backend.onrender.com/api/health`

### **Phase 3: After Frontend Deployment**
1. Deploy frontend to Vercel/Netlify
2. Get frontend URL (e.g., `https://healthcare-app.vercel.app`)
3. Update:
   - `FRONTEND_URL=https://healthcare-app.vercel.app`
   - `CORS_ORIGINS=https://healthcare-app.vercel.app`

### **Phase 4: Optional Features**
1. Add email credentials if using notifications
2. Add payment gateway keys if using payments

---

## 🔐 **Security Best Practices**

1. **Never commit secrets to Git**
2. **Use strong random strings** for JWT_SECRET and ENCRYPTION_MASTER_KEY
3. **Rotate secrets regularly** (every 90 days)
4. **Use environment-specific values** (different for staging/production)
5. **Monitor failed authentication attempts**
6. **Enable Render's automatic SSL** (it's automatic)
7. **Use MongoDB Atlas IP whitelist** (allow Render's IPs or use 0.0.0.0/0)

---

## 🧪 **Testing Your Deployment**

After setting environment variables:

1. **Health Check:**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **CORS Test:**
   ```bash
   curl -H "Origin: https://your-frontend.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://your-backend.onrender.com/api/health
   ```
   Should include CORS headers

3. **API Docs:**
   Visit: `https://your-backend.onrender.com/api-docs`

---

## ❓ **Common Issues**

### Issue: "CORS Error"
**Solution:** Ensure `CORS_ORIGINS` matches your frontend URL exactly (including https://)

### Issue: "MongoDB Connection Failed"
**Solution:** 
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
- Verify connection string format
- Ensure database user has correct permissions

### Issue: "JWT Token Invalid"
**Solution:** Ensure `JWT_SECRET` is set and hasn't changed

### Issue: "WebSocket Connection Failed"
**Solution:** Ensure `SOCKET_URL` is set correctly (same as API_BASE_URL)

---

## 📞 **Need Help?**

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Check Render logs: Dashboard → Your Service → Logs

---

## 🎉 **Quick Start Checklist**

- [ ] Create MongoDB Atlas cluster
- [ ] Generate JWT_SECRET (32+ chars)
- [ ] Generate ENCRYPTION_MASTER_KEY (64 hex chars)
- [ ] Set NODE_ENV=production
- [ ] Set MONGODB_URI
- [ ] Set JWT_SECRET
- [ ] Set ENCRYPTION_MASTER_KEY
- [ ] Set temporary FRONTEND_URL and CORS_ORIGINS
- [ ] Deploy to Render
- [ ] Get Render URL
- [ ] Update API_BASE_URL, API_URL, SOCKET_URL
- [ ] Deploy frontend
- [ ] Update FRONTEND_URL and CORS_ORIGINS
- [ ] Test health endpoint
- [ ] Test CORS
- [ ] Test API endpoints

**You're ready to deploy! 🚀**
