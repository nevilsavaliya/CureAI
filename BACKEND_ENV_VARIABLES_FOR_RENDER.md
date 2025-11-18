# Backend Environment Variables for Render Deployment

## 📋 Complete List of Environment Variables

Copy these into Render's "Environment Variables" section (the screenshot you showed):

### ✅ REQUIRED Variables

```
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
```

### 🔐 MongoDB Connection

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform?retryWrites=true&w=majority
```

**Get this from:**
- MongoDB Atlas → Clusters → Connect → Connect your application
- Copy the connection string
- Replace `<password>` with your actual password
- Replace `<dbname>` with `healthcare-platform`

### 🎯 JWT Secret

```
JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters_long
```

**Generate a secure one:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Manual (use a password generator)
# Example: kJ8mN2pQ5rT9vX3zA6bC4dE7fG1hI0jK
```

### 💳 Payment Gateway (Optional - for UPI payments)

**If using Razorpay:**
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**If using Kotak (when you get credentials):**
```
KOTAK_API_BASE_URL=https://api.kotak.com/upi
KOTAK_CLIENT_ID=your_client_id
KOTAK_CLIENT_SECRET=your_client_secret
KOTAK_MERCHANT_VPA=yourname@kotak
KOTAK_MERCHANT_MOBILE=919876543210
KOTAK_AGGREGATOR_ID=your_aggregator_id
KOTAK_MERCHANT_ID=your_merchant_id
KOTAK_SECRET_KEY=your_32_character_secret_key
```

### 📧 Email Service (Optional - for notifications)

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use that password (not your regular Gmail password)

### ⚙️ Payment Configuration (Optional)

```
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3
```

---

## 🎯 Minimum Required for Basic Deployment

**Start with just these 4:**

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/healthcare-platform
JWT_SECRET=kJ8mN2pQ5rT9vX3zA6bC4dE7fG1hI0jK
```

---

## 📝 How to Add in Render

### Step 1: In Render Dashboard

1. Go to your Web Service
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable one by one

### Step 2: Format

```
NAME_OF_VARIABLE=value_of_variable
```

**Example:**
```
Name: MONGODB_URI
Value: mongodb+srv://admin:pass123@cluster.mongodb.net/healthcare-platform
```

### Step 3: Add All Variables

Add each variable from the list above. Here's the order:

1. `NODE_ENV` = `production`
2. `PORT` = `3000`
3. `MONGODB_URI` = `your_mongodb_connection_string`
4. `JWT_SECRET` = `your_generated_secret`

---

## 🔧 Build & Start Commands for Render

Based on your screenshot, you have:

**Build Command:**
```bash
backend/ $ yarn
```

**Start Command:**
```bash
backend/ $ npm run dev
```

### ⚠️ IMPORTANT: Change Start Command

For production, change the **Start Command** to:

```bash
backend/ $ npm start
```

Or if that doesn't work:

```bash
backend/ $ node server.js
```

**Why?** 
- `npm run dev` uses nodemon (for development)
- `npm start` or `node server.js` is for production

---

## 🗂️ Root Directory Setting

In your screenshot, I see:

**Root Directory:** `/backend`

This is **CORRECT** ✅

---

## 📦 Complete Render Configuration

### Web Service Settings:

```
Name: healthcare-backend (or your choice)
Region: Singapore (Southeast Asia) ✅
Branch: master (or main)
Root Directory: /backend ✅
Runtime: Node
Build Command: yarn (or npm install)
Start Command: npm start (CHANGE THIS!)
```

### Environment Variables:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
```

---

## 🧪 Testing Your Deployment

### Step 1: Check if Backend is Running

After deployment, Render will give you a URL like:
```
https://your-app-name.onrender.com
```

Test it:
```bash
curl https://your-app-name.onrender.com/api/auth/verify
```

Should return:
```json
{
  "valid": false,
  "success": false,
  "message": "No token provided"
}
```

This means backend is working!

### Step 2: Update Frontend

In `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-app-name.onrender.com/api'
};
```

### Step 3: Update CORS in Backend

After you know your frontend URL, add it to `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:4200',  // Development
    'https://your-frontend-url.vercel.app'  // Production
  ],
  credentials: true
}));
```

Then redeploy backend on Render.

---

## 🚨 Common Issues

### Issue: "Application failed to respond"

**Solution:** Check Start Command is `npm start` not `npm run dev`

### Issue: "Cannot connect to MongoDB"

**Solution:** 
1. Check MONGODB_URI is correct
2. Whitelist Render's IP in MongoDB Atlas:
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)

### Issue: "JWT malformed" errors

**Solution:** Make sure JWT_SECRET is set and is at least 32 characters

### Issue: CORS errors

**Solution:** Add your frontend URL to CORS origins in backend/server.js

---

## ✅ Final Checklist

Before deploying:

- [ ] MongoDB Atlas database created
- [ ] MongoDB connection string copied
- [ ] JWT secret generated (32+ characters)
- [ ] All environment variables added in Render
- [ ] Start command changed to `npm start`
- [ ] Root directory set to `/backend`
- [ ] Build command is `yarn` or `npm install`

After first deployment:

- [ ] Test backend URL works
- [ ] Update frontend environment.prod.ts with backend URL
- [ ] Update CORS in backend with frontend URL
- [ ] Redeploy backend
- [ ] Deploy frontend

---

## 🎉 You're Ready!

Once you add these environment variables and fix the start command, your backend will deploy successfully on Render!

**Next Steps:**
1. Add the 4 required environment variables
2. Change start command to `npm start`
3. Click "Deploy"
4. Wait for deployment (5-10 minutes)
5. Test your backend URL
6. Update frontend with backend URL
7. Deploy frontend

Need help with any step? Let me know!
