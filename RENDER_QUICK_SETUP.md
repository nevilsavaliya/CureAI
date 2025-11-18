# Render Quick Setup - Copy & Paste

## 🚀 Environment Variables to Add in Render

Click "Add Environment Variable" and add these one by one:

### 1. NODE_ENV
```
production
```

### 2. PORT
```
3000
```

### 3. MONGODB_URI
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/healthcare-platform?retryWrites=true&w=majority
```
**Replace:** YOUR_USERNAME, YOUR_PASSWORD, YOUR_CLUSTER

### 4. JWT_SECRET
```
Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Or use this example (CHANGE IT!):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## ⚙️ Build & Start Commands

### ❌ WRONG (What you have now):
```
Start Command: backend/ $ npm run dev
```

### ✅ CORRECT (Change to this):
```
Start Command: backend/ $ npm start
```

Or:
```
Start Command: backend/ $ node server.js
```

---

## 📋 Complete Settings

```
Root Directory: /backend ✅ (Keep this)
Build Command: yarn ✅ (Keep this)
Start Command: npm start ⚠️ (CHANGE THIS!)
```

---

## 🎯 After Deployment

Your backend URL will be:
```
https://YOUR-APP-NAME.onrender.com
```

Update frontend `environment.prod.ts`:
```typescript
apiUrl: 'https://YOUR-APP-NAME.onrender.com/api'
```

---

## ✅ Quick Checklist

- [ ] Add NODE_ENV=production
- [ ] Add PORT=3000
- [ ] Add MONGODB_URI (from MongoDB Atlas)
- [ ] Add JWT_SECRET (generate new one)
- [ ] Change Start Command to `npm start`
- [ ] Click "Deploy"
- [ ] Wait 5-10 minutes
- [ ] Test: `curl https://your-app.onrender.com/api/auth/verify`
- [ ] Update frontend with backend URL
- [ ] Deploy frontend

Done! 🎉
