# Ready-to-Use Environment Variables for Render

## 🚀 Copy-Paste These Into Render

Based on your MongoDB credentials, here are your complete environment variables:

### ✅ **Required Variables (Copy these to Render):**

```
NODE_ENV=production
```

```
PORT=3000
```

```
MONGODB_URI=mongodb+srv://Nevil:Nevil9113@cluster0.lqrtuhi.mongodb.net/healthcare-platform?retryWrites=true&w=majority
```

```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6
```

```
JWT_EXPIRES_IN=24h
```

```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

---

## 📝 How to Add in Render

### Step 1: Go to Environment Variables

1. In Render dashboard → Your Web Service
2. Click "Environment" tab
3. Click "Add Environment Variable"

### Step 2: Add Each Variable

**Variable 1:**
- Name: `NODE_ENV`
- Value: `production`

**Variable 2:**
- Name: `PORT`
- Value: `3000`

**Variable 3:**
- Name: `MONGODB_URI`
- Value: `mongodb+srv://Nevil:Nevil9113@cluster0.lqrtuhi.mongodb.net/healthcare-platform?retryWrites=true&w=majority`

**Variable 4:**
- Name: `JWT_SECRET`
- Value: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6`

**Variable 5:**
- Name: `JWT_EXPIRES_IN`
- Value: `24h`

**Variable 6:**
- Name: `FRONTEND_URL`
- Value: `https://your-frontend-url.vercel.app` (update this after you deploy frontend)

---

## ⚙️ Also Fix Your Build Settings

### ❌ Current (Wrong):
```
Start Command: backend/ $ npm run dev
```

### ✅ Change to (Correct):
```
Start Command: backend/ $ npm start
```

---

## 🎯 Complete Render Configuration

```
Name: healthcare-backend
Region: Singapore (Southeast Asia)
Branch: master
Root Directory: /backend
Runtime: Node
Build Command: yarn
Start Command: npm start  ← CHANGE THIS!
```

---

## 📧 Optional: Email Variables (Add Later)

If you want email notifications:

```
EMAIL_USER=savaliyanevil9@gmail.com
```

```
EMAIL_PASSWORD=acnl ikol qamo lojk
```

---

## 💳 Optional: Payment Variables (Add Later)

If you want UPI payments:

```
UPI_ID=9909232769@superyes
```

```
RAZORPAY_KEY_ID=rzp_test_your_key_id
```

```
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## ✅ Quick Checklist

- [ ] Add NODE_ENV=production
- [ ] Add PORT=3000
- [ ] Add MONGODB_URI (with your credentials)
- [ ] Add JWT_SECRET (generated secure key)
- [ ] Add JWT_EXPIRES_IN=24h
- [ ] Add FRONTEND_URL (placeholder for now)
- [ ] Change Start Command to `npm start`
- [ ] Click "Deploy"
- [ ] Wait 5-10 minutes
- [ ] Test backend URL

---

## 🧪 Test Your Backend

After deployment, your backend URL will be something like:
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

This means it's working! ✅

---

## 🔄 Update Frontend Later

After backend is deployed:

1. Copy your backend URL from Render
2. Update `frontend/src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://your-backend-url.onrender.com/api'
   };
   ```
3. Update FRONTEND_URL in Render environment variables
4. Redeploy backend

---

## 🎉 You're Ready!

1. ✅ MongoDB credentials: Ready
2. ✅ JWT secret: Generated
3. ✅ Environment variables: Listed above
4. ✅ Build settings: Instructions provided

**Just add these to Render and deploy!** 🚀

---

## 🐛 If You Get Errors

### "Cannot connect to MongoDB"
- Check if you whitelisted IPs in MongoDB Atlas
- Go to Network Access → Add IP Address → Allow 0.0.0.0/0

### "Application failed to respond"
- Make sure Start Command is `npm start` not `npm run dev`

### "JWT malformed"
- Make sure JWT_SECRET is added correctly

**Need help? Let me know what error you see!**